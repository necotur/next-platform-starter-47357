
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, Trash2 } from 'lucide-react';

export default function ToothMovementsPage() {
  const { data: session } = useSession() || {};
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      loadMovements(selectedPlan.id);
    }
  }, [selectedPlan]);

  async function loadPlans() {
    try {
      const res = await fetch('/api/treatment-plan-3d');
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans);
        if (data.plans.length > 0 && !selectedPlan) {
          setSelectedPlan(data.plans[0]);
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements(planId: string) {
    try {
      const res = await fetch(`/api/tooth-movements?planId=${planId}`);
      const data = await res.json();
      if (data.movements) {
        setMovements(data.movements);
      }
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  }

  async function clearMovements(planId: string) {
    if (!confirm('Are you sure you want to clear all saved tooth movements?')) {
      return;
    }

    try {
      const res = await fetch(`/api/tooth-movements?planId=${planId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadMovements(planId);
        alert('Tooth movements cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing movements:', error);
      alert('Failed to clear movements');
    }
  }

  function exportMovements() {
    if (!selectedPlan || movements.length === 0) {
      alert('No movements to export');
      return;
    }

    const exportData = {
      patient: selectedPlan.patientName,
      doctor: selectedPlan.doctorName || 'N/A',
      date: new Date().toISOString().split('T')[0],
      movements: movements.map((m: any) => ({
        tooth: m.toothName,
        mesialDistal: m.mesialDistal,
        buccalLingual: m.buccalLingual,
        intrusionExtrusion: m.intrusionExtrusion,
        tip: m.tip,
        torque: m.torque,
        rotation: m.rotation,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tooth-movements-${selectedPlan.patientName.replace(/\s+/g, '_')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tooth movements...</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tooth Movements</CardTitle>
            <CardDescription>No 3D treatment plans found</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No 3D treatment plans have been created yet. Please contact your doctor to
              set up a 3D treatment plan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tooth Movement Tracking</h1>
          <p className="text-muted-foreground mt-2">
            View and manage saved tooth movements from 3D viewer
          </p>
        </div>
      </div>

      <Tabs defaultValue="movements" className="w-full">
        <TabsList>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="plans">Treatment Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          {selectedPlan && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedPlan.patientName}</CardTitle>
                    <CardDescription>
                      {selectedPlan.doctorName && `Dr. ${selectedPlan.doctorName} • `}
                      Created {new Date(selectedPlan.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedPlan.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/viewer-3d?planId=${selectedPlan.id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Viewer
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportMovements}
                      disabled={movements.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearMovements(selectedPlan.id)}
                      disabled={movements.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tooth movements recorded yet. Open the 3D viewer and make
                    adjustments to save them here.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tooth</TableHead>
                        <TableHead>Mesial/Distal (mm)</TableHead>
                        <TableHead>Buccal/Lingual (mm)</TableHead>
                        <TableHead>Intrusion/Extrusion (mm)</TableHead>
                        <TableHead>Tip (°)</TableHead>
                        <TableHead>Torque (°)</TableHead>
                        <TableHead>Rotation (°)</TableHead>
                        <TableHead>Saved By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement: any) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">
                            {movement.toothName}
                          </TableCell>
                          <TableCell>{movement.mesialDistal.toFixed(1)}</TableCell>
                          <TableCell>{movement.buccalLingual.toFixed(1)}</TableCell>
                          <TableCell>
                            {movement.intrusionExtrusion.toFixed(1)}
                          </TableCell>
                          <TableCell>{movement.tip.toFixed(1)}</TableCell>
                          <TableCell>{movement.torque.toFixed(1)}</TableCell>
                          <TableCell>{movement.rotation.toFixed(1)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{movement.savedByRole}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'border-primary ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.patientName}</CardTitle>
                  <CardDescription>
                    {plan.doctorName && `Dr. ${plan.doctorName}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      Created: {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                    {plan.portalUrl && (
                      <Badge variant="outline" className="mt-2">
                        Has 3D Portal
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
