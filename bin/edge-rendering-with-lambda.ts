#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EdgeRenderingWithLambdaStack } from '../lib/edge-rendering-with-lambda-stack';

const app = new cdk.App();
new EdgeRenderingWithLambdaStack(app, 'EdgeRenderingWithLambdaStack', {
	env: {
		region: 'us-east-1',
	},
});
