import { ProcessingTracker, TimerScheduler } from '@kubevious/helper-backend';
import { RegistryState } from '@kubevious/state-registry';
import 'mocha';
import should from 'should';

import { setupLogger, LoggerOptions } from 'the-logger';
const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RulesProcessor } from '../src';

const tracker = new ProcessingTracker(logger, new TimerScheduler(logger));

describe('rules-processor', () => {

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

        const processor = new RulesProcessor(logger, [rule]);
        return processor.execute(state, tracker)
            .then(result => {
                should(result).be.ok();
                should(result.rules['my-rule']).be.ok();
            })
    });

});
