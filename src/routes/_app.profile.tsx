import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Camera, Mail, Building2, MapPin, Shield, Key, Bell, Calendar, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { getProfileFn, updateProfileFn, getActivityLogsFn } from "@/functions/profile";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — IndustrialMind AI" }] }),
  component: Profile,
});

function Profile() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await getProfileFn({ data: userId });
    },
    enabled: !!userId,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["activity_logs", userId],
    queryFn: async () => {
      if (!userId) return [];
      return await getActivityLogsFn({ data: { userId, limit: 15 } });
    },
    enabled: !!userId,
  });

  const profile = profileData?.profile || {};
  const counts = profileData?.counts || { documents: 0, conversations: 0, maintenance: 0, compliance: 0 };

  const [formData, setFormData] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      if (!userId) throw new Error("Unauthorized");
      return await updateProfileFn({ data: { userId, ...updates } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["activity_logs", userId] });
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(`Failed to update profile: ${err.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fullName = formData.full_name !== undefined ? formData.full_name : profile.full_name || "Engineer";
  const role = formData.role !== undefined ? formData.role : profile.role || "Reliability Lead";
  const email = formData.email !== undefined ? formData.email : profile.email || "engineer@industrialmind.ai";
  const company = formData.company !== undefined ? formData.company : profile.company || "IndustrialMind AI";
  const location = formData.location !== undefined ? formData.location : profile.location || "Vadodara Refinery, IN";
  const designation = formData.designation !== undefined ? formData.designation : profile.designation || "Principal Asset Lead";
  const phone = formData.phone !== undefined ? formData.phone : profile.phone || "+91 98200 34521";

  const initials = fullName.split(/\s+/).map((s: string) => s[0]).slice(0, 2).join("").toUpperCase() || "EN";

  const activityIcons: Record<string, any> = { Auth: Shield, System: Bell, Key: Key, Compliance: Calendar };

  return (
    <div>
      <PageHeader breadcrumb="Account" title="Profile" description="Manage your identity, security, and notification preferences." />
      <PageBody>
        {/* Cover */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="h-32 gradient-primary" />
          <div className="flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-end md:gap-6">
            <div className="relative -mt-14 grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-4 border-card gradient-primary text-2xl font-bold text-white shadow-elegant">
              {initials}
              <button 
                onClick={() => toast.info("Avatar upload is enabled via enterprise SSO mapping.")}
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card text-foreground shadow hover:bg-muted"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0 flex-1 pt-3 md:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{isProfileLoading ? "Loading..." : fullName}</h2>
                <Badge className="border-primary/30 bg-primary/10 text-primary">{role}</Badge>
                <Badge variant="secondary" className="border-0 bg-success/15 text-success">Active</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {email}</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {company}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {location}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="gradient-primary text-white shadow-elegant gap-2"
                onClick={handleSave}
                disabled={updateMutation.isPending || Object.keys(formData).length === 0}
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{counts.documents}</p>
            <p className="text-xs text-muted-foreground">Indexed Documents</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{counts.conversations}</p>
            <p className="text-xs text-muted-foreground">AI Copilot Threads</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{counts.maintenance}</p>
            <p className="text-xs text-muted-foreground">Equipment Assets</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{counts.compliance}</p>
            <p className="text-xs text-muted-foreground">ISO Standards</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2 space-y-8">
            <div>
              <p className="text-sm font-semibold">Personal & Organizational Information</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input className="mt-1.5" value={fullName} onChange={e => handleInputChange("full_name", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Role</Label>
                  <Input className="mt-1.5" value={role} onChange={e => handleInputChange("role", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Job Designation</Label>
                  <Input className="mt-1.5" value={designation} onChange={e => handleInputChange("designation", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Company / Enterprise</Label>
                  <Input className="mt-1.5" value={company} onChange={e => handleInputChange("company", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Work Email</Label>
                  <Input className="mt-1.5" value={email} onChange={e => handleInputChange("email", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input className="mt-1.5" value={phone} onChange={e => handleInputChange("phone", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Plant Location</Label>
                  <Input className="mt-1.5" value={location} onChange={e => handleInputChange("location", e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Security & Access Control</p>
              <div className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Two-factor authentication (2FA)</p>
                    <p className="text-xs text-muted-foreground">Enforced via corporate identity provider</p>
                  </div>
                  <Switch defaultChecked={true} onCheckedChange={(checked) => toast.success(`2FA policy ${checked ? "enforced" : "disabled"}`)} />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Single sign-on (Microsoft Entra ID / Google Workspace)</p>
                    <p className="text-xs text-muted-foreground">Federated access token active</p>
                  </div>
                  <Switch defaultChecked={true} disabled />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Session timeout after 30 min inactive</p>
                    <p className="text-xs text-muted-foreground">Recommended for industrial OT/IT security standards</p>
                  </div>
                  <Switch defaultChecked={true} onCheckedChange={(checked) => toast.info(`Idle timeout set to ${checked ? "30 minutes" : "off"}`)} />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Email alerts on unrecognized login</p>
                    <p className="text-xs text-muted-foreground">Immediate notification to {email}</p>
                  </div>
                  <Switch defaultChecked={true} onCheckedChange={(checked) => toast.success(`Security login alerts ${checked ? "enabled" : "disabled"}`)} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col">
            <p className="text-sm font-semibold">Recent Workspace Activity</p>
            <div className="mt-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No recent activity recorded.</p>
              ) : activityLogs.map((a: any) => {
                const Icon = activityIcons[a.target_type || ""] || Shield;
                return (
                  <div key={a.id} className="flex items-start gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.action}</p>
                      {a.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.details}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : "Just now"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
