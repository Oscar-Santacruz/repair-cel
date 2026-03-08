'use client'

import { useState } from "react"
import { SimpleCatalogManager } from "./SimpleCatalogManager"
import { ModelManager } from "./ModelManager"
import { CompanyProfileManager } from "./CompanyProfileManager"
import { TaxManager } from "./TaxManager"
import { OrganizationSettingsManager } from "./OrganizationSettingsManager"
import { BankAccountManager } from "./BankAccountManager"
import { ChassisSettingsManager } from "./ChassisSettingsManager"
import { WhatsappConnectionManager } from "@/components/notifications/WhatsappConnectionManager"
import {
    saveSimpleItem,
    saveModel,
    saveTax,
    saveBankAccount,
    deleteBrandAction,
    deleteModelAction,
    deleteVehicleCategoryAction,
    deleteVehicleTypeAction,
    deleteCostConceptAction,
    deletePaymentMethodAction,
    deleteTaxAction,
    deleteBankAccountAction,
    deleteCreditorAction,
    deleteDisplacement,
    deleteExteriorColor,
    deleteInteriorColor
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
        displacements: any[]
        exteriorColors: any[]
        interiorColors: any[]
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
                    <div className="max-w-xl mx-equipo mt-8">
                        <WhatsappConnectionManager />
                    </div>
                )}

                {activeTab === "equipos" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <ChassisSettingsManager settings={data.orgSettings} />

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

                        {/* Paramétricos de Equipos */}
                        <SimpleCatalogManager
                            title="Cilindrajes"
                            items={data.displacements}
                            onSave={(name, id) => saveSimpleItem('displacements', name, id)}
                            onDelete={(id) => deleteDisplacement(id)}
                        />

                        <SimpleCatalogManager
                            title="Colores Exteriores"
                            items={data.exteriorColors}
                            onSave={(name, id) => saveSimpleItem('exterior_colors', name, id)}
                            onDelete={(id) => deleteExteriorColor(id)}
                        />

                        <SimpleCatalogManager
                            title="Colores Interiores"
                            items={data.interiorColors}
                            onSave={(name, id) => saveSimpleItem('interior_colors', name, id)}
                            onDelete={(id) => deleteInteriorColor(id)}
                        />

                        <SimpleCatalogManager
                            title="Condiciones / Familias"
                            items={data.categories}
                            onSave={(name, id) => saveSimpleItem('vehicle_categories', name, id)}
                            onDelete={(id) => deleteVehicleCategoryAction(id)}
                        />
                        <SimpleCatalogManager
                            title="Tipos de Equipos"
                            items={data.types}
                            onSave={(name, id) => saveSimpleItem('vehicle_types', name, id)}
                            onDelete={(id) => deleteVehicleTypeAction(id)}
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
                            onDelete={(id) => deleteCostConceptAction(id)}
                        />
                        <SimpleCatalogManager
                            title="Formas de Pago"
                            items={data.paymentMethods}
                            onSave={(name, id) => saveSimpleItem('payment_methods', name, id)}
                            onDelete={(id) => deletePaymentMethodAction(id)}
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
