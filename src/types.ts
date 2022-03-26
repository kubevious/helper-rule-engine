export interface RuleObject {
    name: string;
    target: string;
    script: string;
}

export interface RuleItem {
    errors: number,
    warnings: number,
    markers: string[],
    dn: string
}

export interface RuleLog
{
    kind: string,
    msg: any,
}

export interface RuleResult
{
    name: string;
    items: RuleItem[],
    logs: RuleLog[],
    markers: Record<string, MarkerResult>, 
    error_count: number;
}

export interface MarkerResult
{
    name: string,
    items: string[],
}

export interface ExecutionContext
{
    rules: Record<string, RuleResult>;
    markers: Record<string, MarkerResult>;
}