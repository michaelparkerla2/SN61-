"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface SearchFormProps {
  onSearch: (query: string, type: string) => void
  isLoading?: boolean
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query, type === "all" ? "" : type)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search memories (e.g., fragmentation, font_enum)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="win">Wins</SelectItem>
            <SelectItem value="rejection">Rejections</SelectItem>
            <SelectItem value="plan">Plans</SelectItem>
            <SelectItem value="avoid">Avoid</SelectItem>
            <SelectItem value="submission">Submissions</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isLoading} className="min-w-[100px]">
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
    </form>
  )
}
