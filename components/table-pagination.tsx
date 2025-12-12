"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function TablePagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: Props) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Mostrando {startItem} a {endItem} de {totalItems} resultados
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
          let pageNum
          if (totalPages <= 3) {
            pageNum = i + 1
          } else if (currentPage === 1) {
            pageNum = i + 1
          } else if (currentPage === totalPages) {
            pageNum = totalPages - 2 + i
          } else {
            pageNum = currentPage - 1 + i
          }

          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(pageNum)}
              className={currentPage === pageNum ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {pageNum}
            </Button>
          )
        })}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
