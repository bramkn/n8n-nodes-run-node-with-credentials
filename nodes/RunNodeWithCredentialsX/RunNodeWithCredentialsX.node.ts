import { IExecuteFunctions } from 'n8n-core';
import {
	IExecuteWorkflowInfo,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWorkflowBase,
	NodeOperationError,
} from 'n8n-workflow';

import subWorkflowTemplate from "./subWorkflowTemplate.json";

export class RunNodeWithCredentialsX implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Run Node With Credentials X',
		name: 'runNodeWithCredentialsX',
		group: ['transform'],
		version: 1,
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
				type: 'number',
				default: 0,
				required: true,
				description: 'ID of the credentials to use',
			},
			{
				displayName: 'Node To Execute',
				name: 'nodeJson',
				type: 'string',
				default: '\n\n\n',
				required: true,
				description: 'JSON of the node to Execute',
				typeOptions: {
					editor: 'json',
					rows: 20,
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < 1; itemIndex++) {
			try {
				item = items[itemIndex];
				const workflowInfo: IExecuteWorkflowInfo = {};
				const nodeJson = this.getNodeParameter('nodeJson', itemIndex, '') as string;
				const credentialsId = this.getNodeParameter('credentialsId', itemIndex, 0) as number;
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
						throw new NodeOperationError(this.getNode(), 'There are no credentials in the node that is entered.', {
							itemIndex,
						});
					}

					const nodeName = nodeParsed.name;
					template.connections.Start.main[0][0]['node'] = nodeName;

					template.nodes.push(nodeParsed);

					workflowInfo.code = template as IWorkflowBase;

					const receivedData = await this.executeWorkflow(workflowInfo, [item]);
					return receivedData;

				}
				catch(error){
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}

			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
