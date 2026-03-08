'use client'

import { useState } from "react"
import { SimpleCatalogManager } from "./SimpleCatalogManager"
import { ModelManager } from "./ModelManager"
import { CompanyProfileManager } from "./CompanyProfileManager"
import { TaxManager } from "./TaxManager"
import { OrganizationSettingsManager } from "./OrganizationSettingsManager"
import { BankAccountManager } from "./BankAccountManager"
import { WhatsappConnectionManager } from "@/components/notifications/WhatsappConnectionManager"
import {
    saveSimpleItem,
    saveModel,
    saveTax,
    saveBankAccount,
    deleteBrandAction,
    deleteModelAction,
    deleteTaxAction,
    deleteBankAccountAction,
    deleteCreditorAction,
} from "@/app/settings-actions"

interface SettingsTabsProps {
    data: {
        brands: any[]
        models: any[]
        categories: any[]
        types: any[]
        costConcepts: any[]
        paymentMethods: any[]
        taxes: any[]
        creditors: any[]
        orgSettings?: any
        bankAccounts: any[]
        debug?: any
    }
    userNames?: Record<string, string>
}

export default function SettingsTabs({ data, userNames = {} }: SettingsTabsProps) {
    const [activeTab, setActiveTab] = useState("enterprise")

    const tabs = [
        { id: "enterprise", label: "Empresa" },
        { id: "equipos", label: "Equipos" },
        { id: "financial", label: "Financiero" },
        { id: "whatsapp", label: "WhatsApp" },
        { id: "others", label: "Otros" },
    ]

    return (
        <div className="space-y-6">
            {/* Tabs Header */}
            <div className="border-b">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === "enterprise" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <CompanyProfileManager settings={data.orgSettings} userNames={userNames} />
                    </div>
                )}

                {activeTab === "whatsapp" && (
                    <div className="max-w-xl mx-auto mt-8">
                        <WhatsappConnectionManager />
                    </div>
                )}

                {activeTab === "equipos" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <SimpleCatalogManager
                            title="Marcas"
                            items={data.brands}
                            onSave={(name, id) => saveSimpleItem('brands', name, id)}
                            onDelete={(id) => deleteBrandAction(id)}
                        />
                        <ModelManager
                            models={data.models}
                            brands={data.brands}
                            onSave={(name, brandId, id) => saveModel(name, brandId, id)}
                            onDelete={(id) => deleteModelAction(id)}
                        />
                    </div>
                )}

                {activeTab === "financial" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <OrganizationSettingsManager settings={data.orgSettings} userNames={userNames} />

                        <SimpleCatalogManager
                            title="Conceptos de Costo"
                            items={data.costConcepts}
                            onSave={(name, id) => saveSimpleItem('cost_concepts', name, id)}
                            onDelete={(id) => deleteBrandAction(id)} // Fallback delete action if specific one is missing
                        />
                        <SimpleCatalogManager
                            title="Formas de Pago"
                            items={data.paymentMethods}
                            onSave={(name, id) => saveSimpleItem('payment_methods', name, id)}
                            onDelete={(id) => deleteBrandAction(id)} // Fallback delete action if specific one is missing
                        />
                        <TaxManager
                            taxes={data.taxes}
                            onSave={(name, rate, id) => saveTax(name, rate, id)}
                            onDelete={(id) => deleteTaxAction(id)}
                        />
                        <BankAccountManager
                            items={data.bankAccounts}
                            onSave={(formData, id) => saveBankAccount(formData, id)}
                            onDelete={(id) => deleteBankAccountAction(id)}
                        />
                    </div>
                )}

                {activeTab === "others" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <SimpleCatalogManager
                            title="Acreedores"
                            items={data.creditors}
                            onSave={(name, id) => saveSimpleItem('creditors', name, id)}
                            onDelete={(id) => deleteCreditorAction(id)}
                        />
                    </div>
                )}
            </div>
        </div >
    )
}
