
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Upload, FileText, Package, File, Search } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  email: string;
}

export default function Upload3DPlanPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [files, setFiles] = useState<{
    htmlFile: File | null;
    unitedModel: File | null;
    separateModel: File | null;
    pdfFile: File | null;
  }>({
    htmlFile: null,
    unitedModel: null,
    separateModel: null,
    pdfFile: null,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPatients();
    }
  }, [status]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/admin/patients');
      const data = await response.json();

      if (response.ok) {
        setPatients(data.patients || []);
      } else {
        toast.error('Failed to load patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const filteredPatients = patients.filter(patient =>
    patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0] || null;
    setFiles({ ...files, [fileType]: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId || !files.htmlFile) {
      toast.error('Please select a patient and HTML file');
      return;
    }

    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    if (!selectedPatient) {
      toast.error('Invalid patient selected');
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('patientId', selectedPatientId);
      uploadFormData.append('patientName', selectedPatient.fullName || selectedPatient.email || 'Unknown Patient');
      uploadFormData.append('doctorName', doctorName || 'Dr. Unknown');

      if (files.htmlFile) uploadFormData.append('htmlFile', files.htmlFile);
      if (files.unitedModel) uploadFormData.append('unitedModel', files.unitedModel);
      if (files.separateModel) uploadFormData.append('separateModel', files.separateModel);
      if (files.pdfFile) uploadFormData.append('pdfFile', files.pdfFile);

      const response = await fetch('/api/3d-plans/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('3D treatment plan uploaded successfully!');
        router.push('/3d-plans');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload 3D treatment plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload 3D Treatment Plan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload Blender-generated HTML viewer with GLB models and PDF report
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Patient Information</h3>
              
              <div>
                <Label htmlFor="patientSearch">Search Patient *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="patientSearch"
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="patientSelect">Select Patient *</Label>
                {loadingPatients ? (
                  <div className="text-sm text-muted-foreground">Loading patients...</div>
                ) : (
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No patients found
                        </div>
                      ) : (
                        filteredPatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.fullName || patient.email || 'Unknown'} ({patient.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input
                  id="doctorName"
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Enter doctor name (optional)"
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <h3 className="font-semibold">Files</h3>

              <div>
                <Label htmlFor="htmlFile" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  HTML Viewer File *
                </Label>
                <Input
                  id="htmlFile"
                  type="file"
                  accept=".html,.htm"
                  onChange={(e) => handleFileChange(e, 'htmlFile')}
                  required
                />
                {files.htmlFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {files.htmlFile.name}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                  ✨ Your HTML will be automatically modified to work with the app (no manual changes needed!)
                </p>
              </div>

              <div>
                <Label htmlFor="unitedModel" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  United Model (GLB)
                </Label>
                <Input
                  id="unitedModel"
                  type="file"
                  accept=".glb,.gltf"
                  onChange={(e) => handleFileChange(e, 'unitedModel')}
                />
                {files.unitedModel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {files.unitedModel.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="separateModel" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Separate Model (GLB)
                </Label>
                <Input
                  id="separateModel"
                  type="file"
                  accept=".glb,.gltf"
                  onChange={(e) => handleFileChange(e, 'separateModel')}
                />
                {files.separateModel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {files.separateModel.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="pdfFile" className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  PDF Report
                </Label>
                <Input
                  id="pdfFile"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'pdfFile')}
                />
                {files.pdfFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {files.pdfFile.name}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Uploading...' : 'Upload Treatment Plan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
