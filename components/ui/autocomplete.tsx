"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // Not used
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface AutocompleteProps {
    options: { label: string; value: string }[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
}

export function Autocomplete({
    options,
    value,
    onValueChange,
    placeholder = "Select...",
    emptyMessage = "No found.",
    disabled = false,
    className
}: AutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    // Initialize input value with the label of the selected value
    const selectedOption = options.find((option) => option.value === value)
    const [inputValue, setInputValue] = React.useState(selectedOption?.label || "")

    // Update input value when external value changes
    React.useEffect(() => {
        const option = options.find((o) => o.value === value)
        if (option) {
            setInputValue(option.label)
        } else if (!value) {
            // setInputValue("") // Only clear if strictly needed?
            // If user is adding a new specific value that is not in list (if supported), we might not want to clear.
            // But here we enforce selection from list?
            // The user requirement "escribir directo" might imply they want to search.
            // If existing value is cleared externally, clear input.
            setInputValue("")
        }
    }, [value, options])

    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options
        return options.filter((option) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
        )
    }, [options, inputValue])

    const handleSelect = React.useCallback((currentValue: string) => {
        // currentValue from CommandItem is usually the value passed to it.
        const option = options.find(o => o.value === currentValue)
        if (option) {
            onValueChange(option.value)
            setInputValue(option.label)
        }
        setOpen(false)
    }, [options, onValueChange])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        setOpen(true)
    }

    const handleInputFocus = () => {
        setOpen(true)
    }

    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        // Prevent click from bubbling to PopoverTrigger, which would toggle the popover off
        e.stopPropagation()
        setOpen(true)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-full">
                    <Input
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onClick={handleInputClick}
                        disabled={disabled}
                        className={cn("w-full pr-8", className)} // Add padding for icon
                    />
                    <ChevronsUpDown className="absolute right-2 top-2.5 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                    <CommandList>
                        {filteredOptions.length === 0 && <CommandEmpty>{emptyMessage}</CommandEmpty>}
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={handleSelect}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
