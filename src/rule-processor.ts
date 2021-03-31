import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger' ;

import { ProcessingTrackerScoper } from '@kubevious/helpers/dist/processing-tracker';

import { RuleProcessor as KubikRuleProcessor } from '@kubevious/kubik';
import { RuleItem, RuleObject, RuleResult } from './types';
import { RegistryState } from '@kubevious/helpers/dist/registry-state';


export class RuleProcessor
{
    private _logger : ILogger;
    private _rule: RuleObject;

    constructor(logger: ILogger, rule: RuleObject)
    {
        this._logger = logger.sublogger("RuleProcessor");
        this._rule = rule;
    }

    get logger() {
        return this._logger;
    }

    execute(state : RegistryState, tracker : ProcessingTrackerScoper) : Promise<RuleResult>
    {
        this._logger.info("[execute] date: %s, count: %s", 
            state.date.toISOString(),
            state.getCount())

        return tracker.scope("execute", () => {
            return this._processRule(state, this._rule)
        })
    }
    
    private _processRule(state: RegistryState, rule: RuleObject) : Promise<RuleResult>
    {
        this.logger.info('[_processRule] Begin: %s', rule.name);
        this.logger.verbose('[_processRule] Begin: ', rule);

        const ruleResult : RuleResult = {
            name: rule.name,
            error_count: 0,
            items: [],
            markers: {},
            logs: []
        };

        let processor = new KubikRuleProcessor(state, rule);
        return processor.process()
            .then((result) => {
                this.logger.silly('[_processRule] RESULT: ', result);
                this.logger.silly('[_processRule] RESULT ITEMS: ', result.ruleItems);

                if (result.success)
                {
                    for(let dn of _.keys(result.ruleItems))
                    {
                        this.logger.debug('[_processRule] RuleItem: %s', dn);

                        let ruleItemInfo = result.ruleItems[dn];

                        let ruleItem : Partial<RuleItem> = {
                            dn: dn,
                            errors: 0,
                            warnings: 0,
                            markers: []
                        };

                        let alertsToRaise : AlertInfo[] = [];

                        if (ruleItemInfo.errors) {

                            if (ruleItemInfo.errors.messages &&
                                ruleItemInfo.errors.messages.length > 0)
                            {
                                ruleItem.errors = ruleItemInfo.errors.messages.length;
                                for(let msg of ruleItemInfo.errors.messages)
                                {
                                    alertsToRaise.push({ 
                                        severity: 'error',
                                        message:  'Rule ' + rule.name + ' failed. ' + msg
                                    });
                                }
                            }
                            else
                            {
                                ruleItem.errors = 1;
                                alertsToRaise.push({ 
                                    severity: 'error',
                                    message:  'Rule ' + rule.name + ' failed.'
                                });
                            }
                        }
                        else if (ruleItemInfo.warnings)
                        {
                            if (ruleItemInfo.warnings.messages && 
                                ruleItemInfo.warnings.messages.length > 0)
                            {
                                ruleItem.warnings = ruleItemInfo.warnings.messages.length;
                                for(let msg of ruleItemInfo.warnings.messages)
                                {
                                    alertsToRaise.push({ 
                                        severity: 'warn',
                                        message:  'Rule ' + rule.name + ' failed. ' + msg
                                    });
                                }
                            }
                            else
                            {
                                ruleItem.warnings = 1;
                                alertsToRaise.push({ 
                                    severity: 'warn',
                                    message:  'Rule ' + rule.name + ' failed.'
                                });
                            }
                        }

                        for(let alertInfo of alertsToRaise)
                        {
                            state.raiseAlert(dn, {
                                id: 'rule-' + rule.name,
                                severity: alertInfo.severity,
                                msg: alertInfo.message,
                                source: {
                                    kind: 'rule',
                                    id: rule.name
                                }
                            });
                        }

                        if (ruleItemInfo.marks)
                        {
                            for(let marker of _.keys(ruleItemInfo.marks))
                            {
                                state.raiseMarker(dn, marker);

                                ruleItem.markers!.push(marker);

                                if (!ruleResult.markers[marker]) {
                                    ruleResult.markers[marker] = {
                                        name: marker,
                                        items: []
                                    }
                                }

                                ruleResult.markers[marker].items.push(dn);
                            }
                        }
                    }
                }
                else
                {
                    this.logger.error('[_processRule] Failed: ', result.messages);

                    for(let msg of result.messages)
                    {
                        ruleResult.logs.push({
                            kind: 'error',
                            msg: msg
                        });

                        ruleResult.error_count++;
                    }
                }

                return ruleResult;
            });
    }

}


interface AlertInfo {
    severity: string,
    message: string
}