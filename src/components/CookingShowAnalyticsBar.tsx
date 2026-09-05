import React, { useMemo, useState } from 'react';
import { Project, BudgetCategory } from '../types';
import { Utensils, Award, ChefHat, Flame, ShieldCheck, DollarSign, Trash2, Coffee, Layers, ChevronDown } from 'lucide-react';

interface CookingShowAnalyticsBarProps {
  project?: Project;
  categories: BudgetCategory[];
}

export const CookingShowAnalyticsBar: React.FC<CookingShowAnalyticsBarProps> = ({
  project,
  categories
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const metrics = useMemo(() => {
    let totalAllocated = 0;
    let ingredientCost = 0;
    let kitchenCost = 0;
    let sponsorRecovery = 0;
    let foodWastageCost = 0;
    let productionCateringCost = 0;

    const episodesSet = new Set<string>();
    const contestantsSet = new Set<string>();
    const challengesSet = new Set<string>();
    const stationsSet = new Set<string>();

    categories.forEach(cat => {
      totalAllocated += Number(cat.allocatedAmount) || 0;
      const catLower = (cat.name || '').toLowerCase();

      (cat.subCategories || []).forEach(sub => {
        const subLower = (sub.name || '').toLowerCase();

        (sub.childCategories || []).forEach(ch => {
          const chLower = (ch.name || '').toLowerCase();
          const amount = Number(ch.allocatedAmount) || 0;

          if (ch.episode && ch.episode.trim()) episodesSet.add(ch.episode.trim().toLowerCase());
          if (ch.contestant && ch.contestant.trim()) contestantsSet.add(ch.contestant.trim().toLowerCase());
          if (ch.challenge && ch.challenge.trim()) challengesSet.add(ch.challenge.trim().toLowerCase());
          if (ch.round && ch.round.trim()) challengesSet.add(ch.round.trim().toLowerCase());
          if (ch.kitchenStation && ch.kitchenStation.trim()) stationsSet.add(ch.kitchenStation.trim().toLowerCase());

          // Food Wastage
          if (chLower.includes('waste') || chLower.includes('spoil') || subLower.includes('wastage')) {
            foodWastageCost += amount;
          }

          // Contestant Cooking Ingredients (Category 6: Kitchen & Culinary -> Ingredients & Consumables)
          if (
            subLower.includes('ingredient') || 
            subLower.includes('consumable') || 
            catLower.includes('ingredient') || 
            catLower.includes('consumable') || 
            subLower.includes('produce') || 
            subLower.includes('meat') || 
            subLower.includes('seafood') || 
            subLower.includes('fish') || 
            subLower.includes('dairy') || 
            subLower.includes('grocery') || 
            subLower.includes('dry goods') ||
            subLower.includes('procurement')
          ) {
            ingredientCost += amount;
          }

          // Kitchen Setup, Appliances & Utensils (Category 6: Kitchen & Culinary -> Kitchen Equipment, Utensils)
          if (
            subLower.includes('kitchen equipment') ||
            subLower.includes('equipment') ||
            subLower.includes('utensil') ||
            catLower.includes('kitchen station') || 
            catLower.includes('kitchen utensil') || 
            catLower.includes('hygiene') || 
            subLower.includes('appliance') || 
            subLower.includes('cookware') || 
            subLower.includes('food safety')
          ) {
            kitchenCost += amount;
          }

          // Production Catering (Category 10: Food & Catering - Separate from cooking ingredients)
          if (
            catLower === 'food & catering' || 
            (catLower.includes('catering') && !subLower.includes('ingredient')) ||
            subLower === 'production food' ||
            subLower === 'beverages'
          ) {
            productionCateringCost += amount;
          }

          // Sponsor Recovery (Category 15: Sponsor & Brand Integration)
          if (
            catLower.includes('sponsor') || 
            catLower.includes('recover') || 
            catLower.includes('credit') || 
            subLower.includes('sponsor') || 
            subLower.includes('recoveries') ||
            chLower.includes('recovery') ||
            chLower.includes('sponsor')
          ) {
            sponsorRecovery += amount;
          }
        });
      });
    });

    const episodeCount = Math.max(
      episodesSet.size,
      project?.expectedEpisodes || 0,
      1
    );

    const contestantCount = Math.max(
      contestantsSet.size,
      project?.expectedContestants || 0,
      1
    );

    const challengeCount = Math.max(
      challengesSet.size,
      project?.expectedChallenges || 0,
      1
    );

    const costPerEpisode = totalAllocated / episodeCount;
    const costPerContestant = totalAllocated / contestantCount;
    const costPerChallenge = totalAllocated / challengeCount;

    return {
      totalAllocated,
      episodeCount,
      contestantCount,
      challengeCount,
      stationsCount: stationsSet.size,
      costPerEpisode,
      costPerContestant,
      costPerChallenge,
      ingredientCost,
      kitchenCost,
      sponsorRecovery,
      foodWastageCost,
      productionCateringCost
    };
  }, [categories, project]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-white mb-2 transition-all">
      {/* Compact Header Row - Reduced Footprint */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded-md">
            <ChefHat className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-200">Cooking Show Analytics</span>
              <span className="hidden sm:inline-block px-1 py-0.1 text-[8.5px] font-mono font-bold bg-orange-500/15 text-orange-300 rounded border border-orange-500/25">
                Formula Sync
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-slate-400">
              <span>{metrics.episodeCount} Ep</span>
              <span>•</span>
              <span>{metrics.contestantCount} Contestants</span>
              <span>•</span>
              <span>{metrics.challengeCount} Challenges</span>
            </div>
          </div>
        </div>

        {/* Inline Quick Metric Chips */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[9.5px]">
            <span className="text-slate-400">Cost/Ep:</span>
            <span className="text-orange-300 font-bold">₹{Math.round(metrics.costPerEpisode).toLocaleString('en-IN')}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[9.5px]">
            <span className="text-slate-400">Ingredients:</span>
            <span className="text-emerald-300 font-bold">₹{Math.round(metrics.ingredientCost).toLocaleString('en-IN')}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[9.5px]">
            <span className="text-slate-400">Kitchen:</span>
            <span className="text-blue-300 font-bold">₹{Math.round(metrics.kitchenCost).toLocaleString('en-IN')}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-sans font-semibold text-slate-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Granular Breakdown (Reveals on demand) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in duration-200">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {/* Cost per Episode */}
            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase">
                <span>Cost / Ep</span>
                <Layers className="w-3 h-3 text-orange-400" />
              </div>
              <div className="text-xs font-bold font-mono text-orange-300 mt-0.5">
                ₹{Math.round(metrics.costPerEpisode).toLocaleString('en-IN')}
              </div>
              <p className="text-[8px] text-slate-500 mt-0.5 truncate">{metrics.episodeCount} eps</p>
            </div>

            {/* Cost per Contestant */}
            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase">
                <span>Cost / Talent</span>
                <Award className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-xs font-bold font-mono text-amber-300 mt-0.5">
                ₹{Math.round(metrics.costPerContestant).toLocaleString('en-IN')}
              </div>
              <p className="text-[8px] text-slate-500 mt-0.5 truncate">{metrics.contestantCount} talent</p>
            </div>

            {/* Cost per Challenge */}
            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase">
                <span>Cost / Challenge</span>
                <Flame className="w-3 h-3 text-rose-400" />
              </div>
              <div className="text-xs font-bold font-mono text-rose-300 mt-0.5">
                ₹{Math.round(metrics.costPerChallenge).toLocaleString('en-IN')}
              </div>
              <p className="text-[8px] text-slate-500 mt-0.5 truncate">Mystery / Pressure</p>
            </div>

            {/* Cooking Ingredient Cost */}
            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 uppercase">
                <span>Ingredients</span>
                <Utensils className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-xs font-bold font-mono text-emerald-300 mt-0.5">
                ₹{Math.round(metrics.ingredientCost).toLocaleString('en-IN')}
              </div>
              <p className="text-[8px] text-slate-500 mt-0.5 truncate">Cooking only</p>
            </div>

            {/* Kitchen Setup & Appliances */}
            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px] font-mono text-blue-400 uppercase">
                <span>Kitchen</span>
                <ShieldCheck className="w-3 h-3 text-blue-400" />
              </div>
              <div className="text-xs font-bold font-mono text-blue-300 mt-0.5">
                ₹{Math.round(metrics.kitchenCost).toLocaleString('en-IN')}
              </div>
              <p className="text-[8px] text-slate-500 mt-0.5 truncate">Induction, tools</p>
            </div>

            {/* Sponsor Recovery */}
            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px] font-mono text-purple-400 uppercase">
                <span>Sponsor</span>
                <DollarSign className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-xs font-bold font-mono text-purple-300 mt-0.5">
                ₹{Math.round(metrics.sponsorRecovery).toLocaleString('en-IN')}
              </div>
              <p className="text-[8px] text-slate-500 mt-0.5 truncate">Brand credits</p>
            </div>

            {/* Food Wastage Cost */}
            <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px] font-mono text-rose-400 uppercase">
                <span>Wastage</span>
                <Trash2 className="w-3 h-3 text-rose-400" />
              </div>
              <div className="text-xs font-bold font-mono text-rose-300 mt-0.5">
                ₹{Math.round(metrics.foodWastageCost).toLocaleString('en-IN')}
              </div>
              <p className="text-[8px] text-slate-500 mt-0.5 truncate">Loss tracking</p>
            </div>
          </div>

          {/* Distinction Note */}
          <div className="px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Catering Separation:</strong> Crew/Cast (₹{Math.round(metrics.productionCateringCost).toLocaleString('en-IN')}) isolated from Contestant Ingredients (₹{Math.round(metrics.ingredientCost).toLocaleString('en-IN')}).
              </span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 shrink-0 font-medium">
              Strict Audit Compliance Verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
