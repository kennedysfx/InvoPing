
"use client";

import { useState } from "react";
import { adminUpdateSubscriptionAction } from "@/actions/admin";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

type Plan = "FREE" | "STARTER" | "PRO";

export default function SubscriptionOverrideButton({
  businessId,
  currentPlan,
}: {
  businessId: string;
  currentPlan: string;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [reason, setReason] = useState("");

  function openConfirmation(plan: Plan) {
    if (plan === currentPlan || loading) return;

    setSelectedPlan(plan);
    setReason("");
  }

  function closeConfirmation() {
    if (loading) return;

    setSelectedPlan(null);
    setReason("");
  }

  async function confirmChange() {
    if (!selectedPlan || loading) return;

    const cleanReason = reason.trim();

    if (cleanReason.length < 5 || cleanReason.length > 500) {
      toast.error("Enter a reason between 5 and 500 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await adminUpdateSubscriptionAction(
        businessId,
        selectedPlan,
        cleanReason
      );

      if (res.success) {
        toast.success(
          `Subscription plan updated to ${selectedPlan}!`
        );

        setSelectedPlan(null);
        setReason("");
      } else {
        toast.error(
          res.error || "Failed to update subscription."
        );
      }
    } catch {
      toast.error("Unable to update subscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-1.5">
        {(["FREE", "STARTER", "PRO"] as const).map(
          (plan) => (
            <button
              key={plan}
              type="button"
              disabled={loading || plan === currentPlan}
              onClick={() => openConfirmation(plan)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors disabled:cursor-not-allowed ${
                currentPlan === plan
                  ? "bg-rose-600 text-white border-rose-500"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white disabled:opacity-50"
              }`}
            >
              {plan}
            </button>
          )
        )}
      </div>

      {selectedPlan && (
        <div className="w-72 max-w-[80vw] bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-3 text-left shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">
              Confirm Plan Change
            </h3>

            <button
              type="button"
              disabled={loading}
              onClick={closeConfirmation}
              aria-label="Close confirmation"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Change subscription from{" "}
            <strong>{currentPlan}</strong> to{" "}
            <strong className="text-rose-400">
              {selectedPlan}
            </strong>
            ?
          </p>

          <div>
            <label
              htmlFor={`reason-${businessId}`}
              className="block text-xs font-semibold text-slate-300 mb-2"
            >
              Reason for manual change
            </label>

            <textarea
              id={`reason-${businessId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              maxLength={500}
              rows={3}
              placeholder="Explain why this subscription is being changed..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />

            <p className="text-[10px] text-slate-500 mt-1">
              {reason.trim().length}/500 characters
              (minimum 5)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={closeConfirmation}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                loading ||
                reason.trim().length < 5 ||
                reason.trim().length > 500
              }
              onClick={confirmChange}
              className="flex-1 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Confirm Change"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
