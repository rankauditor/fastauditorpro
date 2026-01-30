import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Save, RotateCcw, AlertTriangle, Check, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditQuestion {
  id: string;
  text: string;
  weight: number;
  mandatory: boolean;
  description: string;
}

interface QualityCategory {
  id: string;
  category: string;
  questions: AuditQuestion[];
}

interface ScoringRules {
  pass_threshold: number;
  fail_on_mandatory: boolean;
  allow_partial: boolean;
}

interface QualitySettings {
  quality_criteria: QualityCategory[];
  scoring_rules: ScoringRules;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<QualitySettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery<QualitySettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newSettings: QualitySettings) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
      setLocalSettings(null);
      setHasChanges(false);
      toast({ title: "Settings saved", description: "Your quality criteria have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset settings");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
      setLocalSettings(null);
      setHasChanges(false);
      toast({ title: "Settings reset", description: "Quality criteria restored to defaults." });
    },
  });

  const currentSettings = localSettings || settings;

  const updateSettings = (updater: (s: QualitySettings) => QualitySettings) => {
    if (!currentSettings) return;
    const updated = updater(JSON.parse(JSON.stringify(currentSettings)));
    setLocalSettings(updated);
    setHasChanges(true);
  };

  const addCategory = () => {
    updateSettings((s) => {
      s.quality_criteria.push({
        id: generateId(),
        category: "New Category",
        questions: [],
      });
      return s;
    });
  };

  const deleteCategory = (categoryId: string) => {
    updateSettings((s) => {
      s.quality_criteria = s.quality_criteria.filter((c) => c.id !== categoryId);
      return s;
    });
  };

  const updateCategory = (categoryId: string, name: string) => {
    updateSettings((s) => {
      const cat = s.quality_criteria.find((c) => c.id === categoryId);
      if (cat) cat.category = name;
      return s;
    });
  };

  const addQuestion = (categoryId: string) => {
    updateSettings((s) => {
      const cat = s.quality_criteria.find((c) => c.id === categoryId);
      if (cat) {
        cat.questions.push({
          id: generateId(),
          text: "New question",
          weight: 3,
          mandatory: false,
          description: "Describe what good looks like for this question.",
        });
      }
      return s;
    });
  };

  const deleteQuestion = (categoryId: string, questionId: string) => {
    updateSettings((s) => {
      const cat = s.quality_criteria.find((c) => c.id === categoryId);
      if (cat) {
        cat.questions = cat.questions.filter((q) => q.id !== questionId);
      }
      return s;
    });
  };

  const updateQuestion = (categoryId: string, questionId: string, updates: Partial<AuditQuestion>) => {
    updateSettings((s) => {
      const cat = s.quality_criteria.find((c) => c.id === categoryId);
      if (cat) {
        const q = cat.questions.find((q) => q.id === questionId);
        if (q) Object.assign(q, updates);
      }
      return s;
    });
  };

  const updateScoringRules = (updates: Partial<ScoringRules>) => {
    updateSettings((s) => {
      Object.assign(s.scoring_rules, updates);
      return s;
    });
  };

  if (isLoading || !currentSettings) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const totalQuestions = currentSettings.quality_criteria.reduce((sum, c) => sum + c.questions.length, 0);
  const mandatoryCount = currentSettings.quality_criteria.reduce(
    (sum, c) => sum + c.questions.filter((q) => q.mandatory).length,
    0
  );

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Quality Criteria Settings</h1>
            <p className="text-slate-500 mt-1">
              Define what quality means for your call audits. The AI will evaluate each call against these criteria.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={() => localSettings && saveMutation.mutate(localSettings)}
              disabled={!hasChanges || saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4" />
            You have unsaved changes. Click "Save Changes" to apply them.
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{currentSettings.quality_criteria.length}</div>
              <div className="text-sm text-slate-500">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{totalQuestions}</div>
              <div className="text-sm text-slate-500">Total Questions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-500">{mandatoryCount}</div>
              <div className="text-sm text-slate-500">Mandatory Questions</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scoring Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Pass Threshold</div>
                <div className="text-sm text-slate-500">Minimum score percentage to pass the audit</div>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[currentSettings.scoring_rules.pass_threshold]}
                  onValueChange={([v]) => updateScoringRules({ pass_threshold: v })}
                  min={50}
                  max={100}
                  step={5}
                  className="w-40"
                />
                <span className="text-lg font-bold w-12 text-right">{currentSettings.scoring_rules.pass_threshold}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Fail on Mandatory</div>
                <div className="text-sm text-slate-500">Automatically fail if any mandatory question fails</div>
              </div>
              <Switch
                checked={currentSettings.scoring_rules.fail_on_mandatory}
                onCheckedChange={(v) => updateScoringRules({ fail_on_mandatory: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Allow Partial Scoring</div>
                <div className="text-sm text-slate-500">Allow "Partial" answers (not just Yes/No)</div>
              </div>
              <Switch
                checked={currentSettings.scoring_rules.allow_partial}
                onCheckedChange={(v) => updateScoringRules({ allow_partial: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quality Categories</CardTitle>
            <Button size="sm" variant="outline" onClick={addCategory}>
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {currentSettings.quality_criteria.map((category) => (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="w-4 h-4 text-slate-300" />
                      <Input
                        value={category.category}
                        onChange={(e) => updateCategory(category.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-xs font-medium"
                      />
                      <span className="text-sm text-slate-400 ml-auto mr-4">
                        {category.questions.length} question{category.questions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {category.questions.map((question) => (
                        <div key={question.id} className="bg-slate-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <Input
                              value={question.text}
                              onChange={(e) =>
                                updateQuestion(category.id, question.id, { text: e.target.value })
                              }
                              placeholder="Question text"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteQuestion(category.id, question.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            value={question.description}
                            onChange={(e) =>
                              updateQuestion(category.id, question.id, { description: e.target.value })
                            }
                            placeholder="Description / expectation for AI"
                            className="text-sm"
                          />
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500">Weight:</span>
                              <Slider
                                value={[question.weight]}
                                onValueChange={([v]) =>
                                  updateQuestion(category.id, question.id, { weight: v })
                                }
                                min={1}
                                max={5}
                                step={1}
                                className="w-24"
                              />
                              <span className="text-sm font-medium w-6">{question.weight}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={question.mandatory}
                                onCheckedChange={(v) =>
                                  updateQuestion(category.id, question.id, { mandatory: v })
                                }
                              />
                              <span className="text-sm text-slate-500">Mandatory</span>
                              {question.mandatory && <Check className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2">
                        <Button size="sm" variant="outline" onClick={() => addQuestion(category.id)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Question
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Category
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
