
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Eye, Upload, Calendar, User } from 'lucide-react';

interface TreatmentPlan {
  id: string;
  patientName: string;
  doctorName?: string;
  status: string;
  viewCount: number;
  createdAt: string;
  lastViewedAt?: string;
}

export default function TreatmentPlansPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPlans();
    }
  }, [status]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/3d-plans/list');
      const data = await response.json();

      if (response.ok) {
        setPlans(data.plans);
      } else {
        toast.error('Failed to load treatment plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load treatment plans');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = (planId: string) => {
    router.push(`/3d-plans/viewer?planId=${planId}`);
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    router.push('/signin');
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">3D Treatment Plans</h1>
          <p className="text-muted-foreground">View and manage 3D dental models</p>
        </div>
        
        {(session.user as any)?.role === 'admin' && (
          <Button onClick={() => router.push('/admin/upload-3d-plan')}>
            <Upload className="w-4 h-4 mr-2" />
            Upload New Plan
          </Button>
        )}
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No 3D treatment plans available yet.</p>
            {(session.user as any)?.role === 'admin' && (
              <Button 
                onClick={() => router.push('/admin/upload-3d-plan')} 
                className="mt-4"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {plan.patientName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {plan.doctorName && (
                    <p className="text-muted-foreground">
                      Doctor: {plan.doctorName}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {plan.viewCount} views
                  </div>

                  <div className={`inline-block px-2 py-1 rounded text-xs ${
                    plan.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status}
                  </div>
                </div>

                <Button 
                  onClick={() => handleViewPlan(plan.id)} 
                  className="w-full mt-4"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View 3D Model
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
