import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger' ;

import { ProcessingTrackerScoper } from '@kubevious/helper-backend';
import { RegistryState } from '@kubevious/state-registry';

import { RuleProcessor } from './rule-processor';
import { ExecutionContext, RuleObject } from './types';

export class RulesProcessor
{
    private _logger : ILogger;
    private _rules: RuleObject[];

    constructor(logger: ILogger, rules: RuleObject[])
    {
        this._logger = logger.sublogger("RulesProcessor");
        this._rules = rules;
    }

    get logger() {
        return this._logger;
    }

    execute(state : RegistryState, tracker : ProcessingTrackerScoper)
    {
        this._logger.info("[execute] date: %s, count: %s", 
            state.date.toISOString(),
            state.getCount())

        const executionContext : ExecutionContext = {
            rules: {},
            markers: {}
        }

        return tracker.scope("execute", (childTracker) => {
            return this._processRules(state, executionContext, childTracker);
        })
        .then(() => executionContext);
    }

    private _processRules(state : RegistryState, executionContext : ExecutionContext, tracker: ProcessingTrackerScoper)
    {
        return Promise.serial(this._rules, x => {

            return this._processRule(state, x, executionContext, tracker);

        });
    }
    
    private _processRule(state: RegistryState, rule: RuleObject, executionContext : ExecutionContext, tracker: ProcessingTrackerScoper)
    {
        const ruleProcessor = new RuleProcessor(this._logger, rule);
        return ruleProcessor.execute(state, tracker)
            .then(ruleResult => {
                executionContext.rules[rule.name] = ruleResult;

                for(const markerResult of _.values(ruleResult.markers))
                {
                    if (!executionContext.markers[markerResult.name]) {
                        executionContext.markers[markerResult.name] = {
                            name: markerResult.name,
                            items: []
                        };
                    }
                    executionContext.markers[markerResult.name].items = 
                        _.concat(executionContext.markers[markerResult.name].items, markerResult.items);
                }
            })
    }

}