"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatCurrency, calculateSI } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Upload, ChevronRight, ChevronLeft, IndianRupee } from "lucide-react";
import { User } from "@/types";

const STEPS = ["Personal Details", "Salary Slip", "Loan Config", "Review & Apply"];

export default function ApplyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1 - Personal
  const [personal, setPersonal] = useState({ fullName:"", pan:"", dateOfBirth:"", monthlySalary:"", employmentMode:"salaried" });
  const [breResult, setBreResult] = useState<{ passed: boolean; failedRules: string[] } | null>(null);

  // Step 2 - Salary slip
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipUrl, setSlipUrl] = useState("");
  const [slipName, setSlipName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Step 3 - Loan config
  const [loanAmount, setLoanAmount] = useState(150000);
  const [tenure, setTenure] = useState(180);

  const si = calculateSI(loanAmount, tenure);
  const totalRepayment = loanAmount + si;

  useEffect(() => {
    const u = localStorage.getItem("lms_user");
    const role = localStorage.getItem("lms_role");
    if (!u || role !== "borrower") { router.replace("/auth/login"); return; }
    setUser(JSON.parse(u));
  }, [router]);

  // --- BRE Check ---
  const runBRE = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/loans/bre-check", {
        dateOfBirth: personal.dateOfBirth,
        monthlySalary: Number(personal.monthlySalary),
        pan: personal.pan,
        employmentMode: personal.employmentMode,
      });
      const result = res.data.data;
      setBreResult(result);
      if (result.passed) setStep(1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "BRE check failed");
    } finally { setLoading(false); }
  };

  // --- Upload salary slip ---
  const uploadSlip = async () => {
    if (!slipFile) { setError("Please select a file"); return; }
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("salarySlip", slipFile);
      const res = await api.post("/loans/upload-salary-slip", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSlipUrl(res.data.data.fileUrl);
      setSlipName(res.data.data.originalName);
      setStep(2);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  // --- Apply ---
  const applyLoan = async () => {
    setLoading(true); setError("");
    try {
      await api.post("/loans/apply", {
        ...personal,
        monthlySalary: Number(personal.monthlySalary),
        salarySlipUrl: slipUrl,
        salarySlipOriginalName: slipName,
        loanAmount,
        tenure,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; data?: { failedRules?: string[] } } } };
      setError(e.response?.data?.message || "Application failed");
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar userName={user?.name} role="Borrower" />
        <div className="max-w-lg mx-auto px-6 py-24 text-center animate-fade-up">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Application Submitted!</h2>
          <p className="text-zinc-400 mb-8">Your loan application is under review. We&apos;ll process it shortly.</p>
          <Button onClick={() => router.push("/borrower/dashboard")} size="lg">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={user?.name} role="Borrower" />
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-10 animate-fade-up">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all border-2 ${
                  i < step ? "bg-brand-600 border-brand-600 text-white" :
                  i === step ? "bg-brand-600/10 border-brand-500 text-brand-400" :
                  "bg-surface-card border-surface-border text-zinc-600"
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? "text-brand-400" : "text-zinc-600"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${i < step ? "bg-brand-600" : "bg-surface-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface-card border border-surface-border rounded-2xl p-8 animate-fade-up animate-delay-100">

          {/* STEP 0: Personal Details */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Personal Details</h2>
                <p className="text-zinc-500 text-sm mt-1">We&apos;ll check your eligibility based on these details</p>
              </div>
              <Input label="Full Name" placeholder="As on PAN card" value={personal.fullName}
                onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })} required />
              <Input label="PAN Number" placeholder="ABCDE1234F" value={personal.pan}
                onChange={(e) => setPersonal({ ...personal, pan: e.target.value.toUpperCase() })}
                maxLength={10} required hint="Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)" />
              <Input label="Date of Birth" type="date" value={personal.dateOfBirth}
                onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })} required />
              <Input label="Monthly Salary (₹)" type="number" placeholder="50000" value={personal.monthlySalary}
                onChange={(e) => setPersonal({ ...personal, monthlySalary: e.target.value })} required hint="Minimum ₹25,000" />
              <Select label="Employment Mode" value={personal.employmentMode}
                onChange={(e) => setPersonal({ ...personal, employmentMode: e.target.value })}
                options={[
                  { value: "salaried", label: "Salaried" },
                  { value: "self_employed", label: "Self Employed" },
                  { value: "unemployed", label: "Unemployed" },
                ]} />

              {breResult && !breResult.passed && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                    <XCircle className="w-4 h-4" /> Eligibility Check Failed
                  </div>
                  <ul className="space-y-1">
                    {breResult.failedRules.map((r, i) => (
                      <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">{error}</div>}

              <Button onClick={runBRE} loading={loading} className="w-full" size="lg"
                disabled={!personal.fullName || !personal.pan || !personal.dateOfBirth || !personal.monthlySalary}>
                Check Eligibility <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 1: Upload Salary Slip */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Upload Salary Slip</h2>
                <p className="text-zinc-500 text-sm mt-1">PDF, JPG or PNG • Max 5 MB</p>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                  slipFile ? "border-brand-500/50 bg-brand-500/5" : "border-surface-border hover:border-zinc-600"
                }`}
                onClick={() => document.getElementById("slip-input")?.click()}
              >
                <input id="slip-input" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setSlipFile(f); }} />
                <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                {slipFile ? (
                  <div>
                    <p className="text-zinc-200 font-medium">{slipFile.name}</p>
                    <p className="text-zinc-500 text-sm mt-1">{(slipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-zinc-400">Click to select or drag & drop</p>
                    <p className="text-zinc-600 text-sm mt-1">PDF, JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>

              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={uploadSlip} loading={uploading} disabled={!slipFile} className="flex-1" size="lg">
                  Upload & Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Loan Config */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Configure Your Loan</h2>
                <p className="text-zinc-500 text-sm mt-1">Adjust the sliders to find the right loan for you</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Loan Amount</span>
                  <span className="text-zinc-100 font-semibold font-mono">{formatCurrency(loanAmount)}</span>
                </div>
                <input type="range" min={50000} max={500000} step={5000} value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>₹50,000</span><span>₹5,00,000</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tenure</span>
                  <span className="text-zinc-100 font-semibold font-mono">{tenure} days</span>
                </div>
                <input type="range" min={30} max={365} step={5} value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>30 days</span><span>365 days</span>
                </div>
              </div>

              {/* Live calculation */}
              <div className="bg-surface rounded-xl border border-surface-border p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-1">
                  <IndianRupee className="w-4 h-4" /> Loan Breakdown
                </div>
                {[
                  ["Principal", formatCurrency(loanAmount)],
                  ["Rate", "12% p.a. (Simple Interest)"],
                  ["Tenure", `${tenure} days`],
                  ["Interest (SI = P×R×T / 365×100)", formatCurrency(si)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-zinc-300 font-mono">{value}</span>
                  </div>
                ))}
                <div className="border-t border-surface-border pt-3 flex justify-between">
                  <span className="font-semibold text-zinc-200">Total Repayment</span>
                  <span className="font-bold text-brand-400 font-mono text-lg">{formatCurrency(totalRepayment)}</span>
                </div>
              </div>

              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                  Review Application <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Apply */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Review & Apply</h2>
                <p className="text-zinc-500 text-sm mt-1">Please review your application before submitting</p>
              </div>

              <div className="space-y-4">
                <div className="bg-surface rounded-xl border border-surface-border p-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Personal Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Name", personal.fullName],
                      ["PAN", personal.pan],
                      ["Date of Birth", personal.dateOfBirth],
                      ["Monthly Salary", formatCurrency(Number(personal.monthlySalary))],
                      ["Employment", personal.employmentMode.replace("_", " ")],
                      ["Salary Slip", slipName || "Uploaded"],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <span className="text-zinc-500">{l}</span>
                        <p className="text-zinc-200 font-medium capitalize">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface rounded-xl border border-surface-border p-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Loan Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Loan Amount", formatCurrency(loanAmount)],
                      ["Tenure", `${tenure} days`],
                      ["Interest Rate", "12% p.a."],
                      ["Interest (SI)", formatCurrency(si)],
                      ["Total Repayment", formatCurrency(totalRepayment)],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <span className="text-zinc-500">{l}</span>
                        <p className="text-zinc-200 font-medium">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300">By applying you confirm all details are accurate and you agree to the loan terms.</p>
              </div>

              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={applyLoan} loading={loading} className="flex-1" size="lg">
                  Submit Application
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
