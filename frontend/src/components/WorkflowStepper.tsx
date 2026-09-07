import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { CampaignStatus } from '../types';

interface WorkflowStepperProps {
  status: CampaignStatus;
  currentStep?: string;
  errorMessage?: string;
  googleErrorDetails?: string;
  suggestedAction?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

interface StepDef {
  key: string;
  label: string;
  description: string;
  activeStatuses: CampaignStatus[];
  completedStatuses: CampaignStatus[];
}

const STEPS: StepDef[] = [
  {
    key: 'validate',
    label: '1. Validate Campaign',
    description: 'Verify URL accessibility & image dimensions',
    activeStatuses: ['VALIDATING'],
    completedStatuses: [
      'CREATING_ADVERTISER', 'ADVERTISER_READY', 'CREATING_AD_UNIT', 'AD_UNIT_CREATED',
      'CREATING_ORDER', 'ORDER_CREATED', 'CREATING_LINE_ITEM', 'LINE_ITEM_CREATED',
      'CREATING_CREATIVE', 'CREATIVE_CREATED', 'ASSOCIATING_CREATIVE', 'CREATIVE_ASSOCIATED',
      'READY', 'COMPLETED', 'PAUSED'
    ]
  },
  {
    key: 'advertiser',
    label: '2. Advertiser / Company',
    description: 'Find or create advertiser in GAM',
    activeStatuses: ['CREATING_ADVERTISER'],
    completedStatuses: [
      'ADVERTISER_READY', 'CREATING_AD_UNIT', 'AD_UNIT_CREATED', 'CREATING_ORDER',
      'ORDER_CREATED', 'CREATING_LINE_ITEM', 'LINE_ITEM_CREATED', 'CREATING_CREATIVE',
      'CREATIVE_CREATED', 'ASSOCIATING_CREATIVE', 'CREATIVE_ASSOCIATED', 'READY', 'COMPLETED', 'PAUSED'
    ]
  },
  {
    key: 'adunit',
    label: '3. Ad Unit & GPT Tag',
    description: 'Target ad unit & generate GPT code',
    activeStatuses: ['CREATING_AD_UNIT'],
    completedStatuses: [
      'AD_UNIT_CREATED', 'CREATING_ORDER', 'ORDER_CREATED', 'CREATING_LINE_ITEM',
      'LINE_ITEM_CREATED', 'CREATING_CREATIVE', 'CREATIVE_CREATED', 'ASSOCIATING_CREATIVE',
      'CREATIVE_ASSOCIATED', 'READY', 'COMPLETED', 'PAUSED'
    ]
  },
  {
    key: 'order',
    label: '4. Create Order',
    description: 'Create advertiser order in GAM',
    activeStatuses: ['CREATING_ORDER'],
    completedStatuses: [
      'ORDER_CREATED', 'CREATING_LINE_ITEM', 'LINE_ITEM_CREATED', 'CREATING_CREATIVE',
      'CREATIVE_CREATED', 'ASSOCIATING_CREATIVE', 'CREATIVE_ASSOCIATED', 'READY', 'COMPLETED', 'PAUSED'
    ]
  },
  {
    key: 'lineitem',
    label: '5. Create Line Item',
    description: 'Target Ad Unit with flight dates & CPM rate',
    activeStatuses: ['CREATING_LINE_ITEM'],
    completedStatuses: [
      'LINE_ITEM_CREATED', 'CREATING_CREATIVE', 'CREATIVE_CREATED', 'ASSOCIATING_CREATIVE',
      'CREATIVE_ASSOCIATED', 'READY', 'COMPLETED', 'PAUSED'
    ]
  },
  {
    key: 'creative',
    label: '6. Create Creative',
    description: 'Generate ImageCreative with banner & click URL',
    activeStatuses: ['CREATING_CREATIVE'],
    completedStatuses: [
      'CREATIVE_CREATED', 'ASSOCIATING_CREATIVE', 'CREATIVE_ASSOCIATED', 'READY', 'COMPLETED', 'PAUSED'
    ]
  },
  {
    key: 'association',
    label: '7. Associate Creative',
    description: 'Bind Creative to Line Item (LICA)',
    activeStatuses: ['ASSOCIATING_CREATIVE'],
    completedStatuses: [
      'CREATIVE_ASSOCIATED', 'READY', 'COMPLETED', 'PAUSED'
    ]
  },
  {
    key: 'ready',
    label: '8. Campaign Ready',
    description: 'Live and ready for delivery',
    activeStatuses: [],
    completedStatuses: ['READY', 'COMPLETED', 'PAUSED']
  }
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  status,
  currentStep,
  errorMessage,
  googleErrorDetails,
  suggestedAction,
  onRetry,
  isRetrying
}) => {
  const isFailed = status === 'FAILED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Google Ad Manager Workflow Execution</h3>
          <p className="text-sm text-slate-500">Automated end-to-end placement orchestration</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
              status === 'READY' || status === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-800'
                : status === 'FAILED'
                ? 'bg-rose-100 text-rose-800'
                : status === 'PAUSED'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-blue-100 text-blue-800 animate-pulse'
            }`}
          >
            {status}
          </span>
          {isFailed && onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isRetrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Retry Failed Step
            </button>
          )}
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step, idx) => {
          const isCompleted = step.completedStatuses.includes(status);
          const isActive = step.activeStatuses.includes(status);
          const isCurrentFailure = isFailed && (
            (step.key === 'validate' && (!currentStep || currentStep.includes('VALIDAT'))) ||
            (step.key === 'advertiser' && currentStep?.includes('ADVERTISER')) ||
            (step.key === 'adunit' && currentStep?.includes('AD_UNIT')) ||
            (step.key === 'order' && currentStep?.includes('ORDER')) ||
            (step.key === 'lineitem' && currentStep?.includes('LINE_ITEM')) ||
            (step.key === 'creative' && currentStep?.includes('CREATIVE')) ||
            (step.key === 'association' && currentStep?.includes('ASSOCIAT'))
          );

          let stateColor = 'border-slate-200 bg-slate-50 text-slate-400';
          let icon = <Circle className="w-5 h-5 text-slate-300" />;

          if (isCompleted) {
            stateColor = 'border-emerald-200 bg-emerald-50 text-emerald-800';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
          } else if (isActive) {
            stateColor = 'border-blue-300 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20';
            icon = <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
          } else if (isCurrentFailure) {
            stateColor = 'border-rose-300 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20';
            icon = <AlertCircle className="w-5 h-5 text-rose-600" />;
          }

          return (
            <div
              key={step.key}
              className={`p-3.5 rounded-lg border transition-all ${stateColor}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div>
                  <div className="font-semibold text-sm leading-tight text-slate-900">{step.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{step.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Failure Diagnostics Box */}
      {isFailed && errorMessage && (
        <div className="mt-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-rose-950">
                Placement Workflow Failed at step: <code className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-800">{currentStep || 'VALIDATING'}</code>
              </div>
              <div className="text-rose-800">{errorMessage}</div>
              {googleErrorDetails && (
                <div className="mt-2 text-xs font-mono bg-rose-100 p-2.5 rounded border border-rose-200 overflow-x-auto text-rose-950">
                  <div className="font-sans font-bold text-rose-900 mb-1">Google Ad Manager API Error:</div>
                  {googleErrorDetails}
                </div>
              )}
              {suggestedAction && (
                <div className="mt-2 text-xs font-medium text-rose-800 bg-rose-100/70 p-2 rounded">
                  <span className="font-bold">Suggested Remediation:</span> {suggestedAction}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
