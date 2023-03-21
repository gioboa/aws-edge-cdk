import path from 'node:path';
import { Construct } from 'constructs';
import { Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Distribution, LambdaEdgeEventType } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import {
	CfnOutput,
	Stack,
	StackProps,
	aws_s3,
	aws_s3_deployment,
} from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';

const abc = require('@vendia/serverless-express');
export class EdgeRenderingWithLambdaStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const sourceBucket = new Bucket(this, 'qwik-s3-bucket', {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			enforceSSL: true,
		});

		new aws_s3_deployment.BucketDeployment(this, 'DeployStaticFiles', {
			sources: [aws_s3_deployment.Source.asset(path.join(__dirname, '../.aws-edge/static'))],
			destinationBucket: sourceBucket,
		});

		const QwikFunc = new cloudfront.experimental.EdgeFunction(
			this,
			'QwikFunc',
			{
				runtime: Runtime.NODEJS_18_X,
				handler: 'entry-aws-edge.handler',
				code: Code.fromAsset(path.join(__dirname, '../.aws-edge/function')),
			}
		);
		const cfDistro = new Distribution(this, 'cfDist', {
			defaultBehavior: {
				origin: new S3Origin(sourceBucket),
				edgeLambdas: [
					{
						functionVersion: QwikFunc.currentVersion,
						eventType: LambdaEdgeEventType.VIEWER_REQUEST,
					},
				],
			},
		});
		new CfnOutput(this, 'URL', {
			value: cfDistro.distributionDomainName,
			description: 'The CloudFront distribution URL ',
			exportName: 'cf-distro-name',
		});
	}
}
