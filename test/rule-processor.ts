import { ProcessingTracker, TimerScheduler } from '@kubevious/helper-backend';
import { RegistryState } from '@kubevious/state-registry';
import 'mocha';
import should from 'should';

import { setupLogger, LoggerOptions } from 'the-logger';
const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RuleProcessor } from '../src';

const tracker = new ProcessingTracker(logger, new TimerScheduler(logger));

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
