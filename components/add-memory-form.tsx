"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Send } from "lucide-react"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"

interface AddMemoryFormProps {
  onSubmit: (data: {
    key: string
    value: {
      type: string
      version: string
      status: string
      score?: number
      hash?: string
      signals?: string[]
      reason?: string
      fix?: string
      notes?: string
    }
  }) => Promise<void>
  isLoading?: boolean
}

export function AddMemoryForm({ onSubmit, isLoading }: AddMemoryFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    version: "",
    type: "submission",
    status: "pending",
    score: "",
    hash: "",
    signals: "",
    reason: "",
    fix: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const key = `${formData.type}_${formData.version}_${Date.now()}`
    const value = {
      type: formData.type,
      version: formData.version,
      status: formData.status,
      ...(formData.score && { score: parseFloat(formData.score) }),
      ...(formData.hash && { hash: formData.hash }),
      ...(formData.signals && { signals: formData.signals.split(",").map(s => s.trim()).filter(Boolean) }),
      ...(formData.reason && { reason: formData.reason }),
      ...(formData.fix && { fix: formData.fix }),
      ...(formData.notes && { notes: formData.notes }),
    }

    await onSubmit({ key, value })
    
    // Reset form
    setFormData({
      version: "",
      type: "submission",
      status: "pending",
      score: "",
      hash: "",
      signals: "",
      reason: "",
      fix: "",
      notes: "",
    })
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Memory
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add New Memory</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Version</FieldLabel>
                <Input
                  placeholder="e.g., v7, dfp_v8"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  required
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submission">Submission</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="rejection">Rejection</SelectItem>
                    <SelectItem value="plan">Plan</SelectItem>
                    <SelectItem value="avoid">Avoid</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Score (optional)</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.00 - 1.00"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Hash (optional)</FieldLabel>
                <Input
                  placeholder="e.g., 90b4b466..."
                  value={formData.hash}
                  onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
                />
              </Field>
            </FieldGroup>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Signals (comma-separated)</FieldLabel>
              <Input
                placeholder="e.g., font_enum, raf_cadence, canvas_hash"
                value={formData.signals}
                onChange={(e) => setFormData({ ...formData, signals: e.target.value })}
              />
            </Field>
          </FieldGroup>

          {(formData.type === "rejection" || formData.type === "avoid") && (
            <FieldGroup>
              <Field>
                <FieldLabel>Reason</FieldLabel>
                <Textarea
                  placeholder="Why it was rejected or should be avoided..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                />
              </Field>
            </FieldGroup>
          )}

          {(formData.type === "rejection" || formData.type === "win") && (
            <FieldGroup>
              <Field>
                <FieldLabel>Fix Applied</FieldLabel>
                <Textarea
                  placeholder="What fix was applied..."
                  value={formData.fix}
                  onChange={(e) => setFormData({ ...formData, fix: e.target.value })}
                  rows={2}
                />
              </Field>
            </FieldGroup>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel>Notes (optional)</FieldLabel>
              <Textarea
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Send className="h-4 w-4" />
              {isLoading ? "Storing..." : "Store Memory"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
