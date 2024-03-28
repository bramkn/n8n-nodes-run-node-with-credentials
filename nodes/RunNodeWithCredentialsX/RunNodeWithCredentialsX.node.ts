import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { RunNodeWithCredentialsXV1 } from './v1/RunNodeWithCredentialsXV1.node';
import { RunNodeWithCredentialsXV2 } from './v2/RunNodeWithCredentialsXV2.node';

export class RunNodeWithCredentialsX extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Run Node With Credentials X',
			name: 'runNodeWithCredentialsX',
			group: ['transform'],
			icon: 'file:RunKeys.svg',
			description: 'Run any node with specified credentials',
			defaultVersion: 2,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new RunNodeWithCredentialsXV1(baseDescription),
			2: new RunNodeWithCredentialsXV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
