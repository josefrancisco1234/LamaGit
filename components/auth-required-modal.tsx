"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface AuthRequiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignIn: () => void
}

export function AuthRequiredModal({
  open,
  onOpenChange,
  onSignIn,
}: AuthRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm text-center">
        <DialogHeader className="items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <DialogTitle>Autenticacion Requerida</DialogTitle>
          <DialogDescription className="text-base">
            Necesitas iniciar sesion para realizar apuestas con dinero real.
            <br />
            <span className="text-muted-foreground">
              El modo demo esta disponible para apuestas menores a S/ 0.01
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Modo Demo
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onSignIn()
            }}
            className="flex-1"
          >
            Iniciar Sesion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
