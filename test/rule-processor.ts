import { ProcessingTracker } from '@kubevious/helpers/dist/processing-tracker';
import { RegistryState } from '@kubevious/helpers/dist/registry-state';
import 'mocha';
import should = require('should');

import { setupLogger, LoggerOptions } from 'the-logger';
const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RuleProcessor } from '../src';

const tracker = new ProcessingTracker(logger);

describe('rule-processor', () => {

    it('case-01', () => {

        const rule = {
            name: 'my-rule',
            target: 'select("Image")',
            script: 'error("test")'
        }

        const state = new RegistryState({
            date: new Date(),
            items: []
        });

        const processor = new RuleProcessor(logger, rule);
        return processor.execute(state, tracker)
            .then(ruleResult => {
                should(ruleResult).be.ok();
                should(ruleResult.name).be.equal("my-rule");
            })
    });

});
