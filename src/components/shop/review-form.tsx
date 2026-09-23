"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ActionForm } from "@/components/forms/action-form";
import { TextArea } from "@/components/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { submitReview } from "@/actions/reviews";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  return (
    <ActionForm action={submitReview} className="space-y-4" resetOnSuccess>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="label">Sua nota</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} estrela${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-0.5">
              <Star className={cn("h-7 w-7 transition", n <= rating ? "fill-warn text-warn" : "text-white/20 hover:text-warn/60")} />
            </button>
          ))}
        </div>
      </fieldset>
      <TextArea name="comment" label="Comentário (opcional)" rows={3} maxLength={1000} />
      <SubmitButton pendingText="Enviando…">Enviar avaliação</SubmitButton>
    </ActionForm>
  );
}
