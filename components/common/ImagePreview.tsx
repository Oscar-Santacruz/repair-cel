'use client'

import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
    DialogTitle
} from "@/components/ui/dialog"
import Image from "next/image"
import { X, ZoomIn } from "lucide-react"

interface ImagePreviewProps {
    src: string
    alt: string
}

export function ImagePreview({ src, alt }: ImagePreviewProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative w-24 h-24 rounded-md border overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-90 transition-all group">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover"
                        sizes="96px"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-equipo p-0 overflow-hidden bg-transparent border-none shadow-none sm:max-w-4xl">
                <div className="sr-only">
                    <DialogTitle>Vista previa de {alt}</DialogTitle>
                </div>
                <div className="relative w-[90vw] h-[80vh] md:w-[800px] md:h-[600px]">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 800px"
                        priority
                    />
                    <DialogClose className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                        <X className="w-5 h-5" />
                        <span className="sr-only">Cerrar</span>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    )
}
