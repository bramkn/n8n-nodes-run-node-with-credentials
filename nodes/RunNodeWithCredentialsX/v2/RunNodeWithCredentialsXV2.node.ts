/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	IExecuteWorkflowInfo,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	IWorkflowBase,
	NodeOperationError,
} from 'n8n-workflow';

import subWorkflowTemplate from "./subWorkflowTemplate.json";

export class RunNodeWithCredentialsXV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			displayName: 'Run Node With Credentials X',
			name: 'runNodeWithCredentialsX',
			group: ['transform'],
			version: 2,
			icon: 'file:RunKeys.svg',
			subtitle: '={{"CredentialId: " + $parameter["credentialsId"]}}',
			description: 'Run any node with specified credentials',
			defaults: {
				name: 'Run Node WIth Credentials X',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Credentials ID',
				name: 'credentialsId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the credentials to use',
			},
			{
				displayName: 'Node To Execute',
				name: 'nodeJson',
				type: 'json',
				default: '{\n\n}',
				required: true,
				description: 'JSON of the node to Execute',
			},
			],
		};
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let returnData: INodeExecutionData[]= [];
		for (let i = 0; i < items.length; i++) {
			try {
				const workflowInfo: IExecuteWorkflowInfo = {};
				const nodeJson = this.getNodeParameter('nodeJson', i) as string;
				const credentialsId = this.getNodeParameter('credentialsId', i) as string;
				let nodeParsed;
				try{
					nodeParsed = JSON.parse(nodeJson);
					let template = JSON.parse(JSON.stringify(subWorkflowTemplate));


					if(nodeParsed.nodes){
						nodeParsed = nodeParsed.nodes[0];
					}

					if(nodeParsed.credentials){
						const credentialsName = Object.keys(nodeParsed.credentials)[0];
						nodeParsed.credentials[credentialsName].id = credentialsId.toString();
						nodeParsed.position =[
							1000,
							340
						];
					}
					else{
						throw new NodeOperationError(this.getNode(), 'There are no credentials in the node that is entered.', {itemIndex: i});
					}

					const nodeName = nodeParsed.name;
					template.connections.Start.main[0][0]['node'] = nodeName;

					template.nodes.push(nodeParsed);

					workflowInfo.code = template as IWorkflowBase;

					const receivedData = await this.executeWorkflow(workflowInfo);

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(receivedData[0][0].json as IDataObject[]),
						{ itemData: { item: i } },
					);

					returnData.push(...executionData);

				}
				catch(error){
					throw new NodeOperationError(this.getNode(), error, {itemIndex: i});
				}

			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(0)[0].json, error, pairedItem: i });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = i;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {itemIndex: i});
				}
			}
		}
		return [returnData];
	}
}
