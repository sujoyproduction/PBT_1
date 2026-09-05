import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Project, BudgetCategory, Expense } from '../types';
import { STANDARD_DEPARTMENT_WORKSPACES } from '../data/projectTypeTemplates';

// Production Department Modules
import { ProductionDailyPlanning } from './departmentModules/ProductionDailyPlanning';
import { ProductionUnitPlanning } from './departmentModules/ProductionUnitPlanning';
import { ProductionSchedule } from './departmentModules/ProductionSchedule';
import { ProductionCallSheet } from './departmentModules/ProductionCallSheet';
import { ProductionDsrSummary } from './departmentModules/ProductionDsrSummary';
import { ProductionCrewCount } from './departmentModules/ProductionCrewCount';
import { ProductionTransport } from './departmentModules/ProductionTransport';
import { ProductionAccommodation } from './departmentModules/ProductionAccommodation';
import { ProductionFood } from './departmentModules/ProductionFood';
import { ProductionGensetFuel } from './departmentModules/ProductionGensetFuel';
import { ProductionVanity } from './departmentModules/ProductionVanity';
import { ProductionDailyRequirement } from './departmentModules/ProductionDailyRequirement';
import { ProductionIssueTracker } from './departmentModules/ProductionIssueTracker';
import { GenericDepartmentModule } from './departmentModules/GenericDepartmentModule';

interface DepartmentWorkspaceViewProps {
  deptId: string;
  activeSubTab?: string;
  project?: Project;
  categories?: BudgetCategory[];
  expenses?: Expense[];
  onNavigate?: (tab: string, subTab?: string) => void;
}

export const DepartmentWorkspaceView: React.FC<DepartmentWorkspaceViewProps> = ({
  deptId,
  activeSubTab = '',
  project,
  categories = [],
  expenses = [],
  onNavigate
}) => {
  const deptConfig = STANDARD_DEPARTMENT_WORKSPACES.find(d => d.id === deptId) || STANDARD_DEPARTMENT_WORKSPACES[0];
  const [selectedSub, setSelectedSub] = useState<string>(activeSubTab || deptConfig.items[0].id);

  // Synchronize internal selectedSub with activeSubTab prop
  useEffect(() => {
    if (activeSubTab) {
      setSelectedSub(activeSubTab);
    } else if (deptConfig?.items?.[0]?.id) {
      setSelectedSub(deptConfig.items[0].id);
    }
  }, [activeSubTab, deptId, deptConfig]);

  const currentTabObj = deptConfig.items.find(i => i.id === selectedSub) || deptConfig.items[0];

  const renderModuleContent = () => {
    // Production Workspace Sub-tabs
    if (selectedSub === 'prod-daily-planning') {
      return <ProductionDailyPlanning project={project} />;
    }
    if (selectedSub === 'prod-unit-planning') {
      return <ProductionUnitPlanning project={project} />;
    }
    if (selectedSub === 'prod-schedule') {
      return <ProductionSchedule project={project} />;
    }
    if (selectedSub === 'prod-call-sheet') {
      return <ProductionCallSheet project={project} />;
    }
    if (selectedSub === 'prod-dsr') {
      return (
        <ProductionDsrSummary 
          project={project} 
          onNavigateToFullDsr={() => onNavigate && onNavigate('production-dsr')} 
        />
      );
    }
    if (selectedSub === 'prod-crew-count') {
      return <ProductionCrewCount project={project} />;
    }
    if (selectedSub === 'prod-transport') {
      return <ProductionTransport project={project} />;
    }
    if (selectedSub === 'prod-accommodation') {
      return <ProductionAccommodation project={project} />;
    }
    if (selectedSub === 'prod-food') {
      return <ProductionFood project={project} />;
    }
    if (selectedSub === 'prod-genset-fuel') {
      return <ProductionGensetFuel project={project} />;
    }
    if (selectedSub === 'prod-vanity') {
      return <ProductionVanity project={project} />;
    }
    if (selectedSub === 'prod-daily-req') {
      return <ProductionDailyRequirement project={project} />;
    }
    if (selectedSub === 'prod-issue-tracker') {
      return <ProductionIssueTracker project={project} />;
    }

    // Default / Other department subtabs
    return (
      <GenericDepartmentModule
        project={project}
        workspaceName={deptConfig.name}
        tabId={selectedSub}
        tabLabel={currentTabObj.name}
      />
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Workspace Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
              Department Workspace
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Project: {project?.name || 'Active Production'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>{deptConfig.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {deptConfig.description}. Role-authorized control center with task management, daily requirements, expense tracking &amp; live shoot synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate && onNavigate('production-dsr')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>Open Master DSR System</span>
          </button>
        </div>
      </div>

      {/* Workspace Navigation Subtabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {deptConfig.items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedSub(item.id);
              if (onNavigate) onNavigate(deptId, item.id);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedSub === item.id
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Main Module Content */}
      <div className="w-full">
        {renderModuleContent()}
      </div>

    </div>
  );
};

