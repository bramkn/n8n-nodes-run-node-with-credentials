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
				type: 'json',
				required: true,
				default: '',
				description: 'JSON of the node to Execute',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

			try {
				const workflowInfo: IExecuteWorkflowInfo = {};
				const nodeJson = this.getNodeParameter('nodeJson', 0, '') as string;
				const credentialsId = this.getNodeParameter('credentialsId', 0, 0) as number;
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
						throw new NodeOperationError(this.getNode(), 'There are no credentials in the node that is entered.');
					}

					const nodeName = nodeParsed.name;
					template.connections.Start.main[0][0]['node'] = nodeName;

					template.nodes.push(nodeParsed);

					workflowInfo.code = template as IWorkflowBase;

					const receivedData = await this.executeWorkflow(workflowInfo, items);
					return receivedData;

				}
				catch(error){
					throw new NodeOperationError(this.getNode(), error);
				}

			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(0)[0].json, error, pairedItem: 0 });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = 0;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error);
				}
			}


		return this.prepareOutputData(items);
	}
}
