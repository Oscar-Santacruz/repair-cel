'use client'

import { useState, useTransition } from 'react'
import { toggleOrgPlanAction } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, Users, Crown, RefreshCw, LogOut, BarChart3, CalendarDays, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Org {
    id: string
    name: string
    plan: string
    created_at: string
    profiles: { count: number }[]
}

interface Stats {
    userCount: number
    orgCount: number
    organizations: Org[]
}

const ADMIN_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'admin'

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
    const [orgs, setOrgs] = useState<Org[]>(stats.organizations)
    const [isPending, startTransition] = useTransition()
    const [loadingOrgId, setLoadingOrgId] = useState<string | null>(null)
    const [botStatus, setBotStatus] = useState<'idle' | 'checking' | 'connected' | 'disconnected' | 'qr'>('idle')
    const [qrData, setQrData] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL
    const botToken = process.env.NEXT_PUBLIC_WHATSAPP_BOT_TOKEN

    const handleTogglePlan = async (orgId: string, currentPlan: string) => {
        const newPlan = currentPlan === 'free' ? 'pro' : 'free'
        setLoadingOrgId(orgId)
        startTransition(async () => {
            try {
                await toggleOrgPlanAction(orgId, newPlan as 'free' | 'pro')
                setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, plan: newPlan } : o))
            } catch (e) {
                console.error(e)
            } finally {
                setLoadingOrgId(null)
            }
        })
    }

    const handleCheckBotStatus = async () => {
        setBotStatus('checking')
        setQrData(null)
        try {
            const res = await fetch(`/api/bot-status?orgId=${ADMIN_ORG_ID}`)
            const data = await res.json()
            if (data.connected) {
                setBotStatus('connected')
            } else if (data.qr) {
                setBotStatus('qr')
                setQrData(data.qr)
            } else {
                setBotStatus('disconnected')
            }
        } catch {
            setBotStatus('disconnected')
        }
    }

    const handleConnectBot = async () => {
        setBotStatus('checking')
        try {
            await fetch('/api/bot-connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId: ADMIN_ORG_ID })
            })
            setTimeout(handleCheckBotStatus, 2000)
        } catch {
            setBotStatus('disconnected')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', fontFamily: "'Inter', sans-serif" }}>
            {/* Top Nav */}
            <nav style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={28} color="#a78bfa" />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>CarSale Admin</span>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <LogOut size={16} /> Salir
                </button>
            </nav>

            <div style={{ maxWidth: '1200px', margin: '0 equipo', padding: '2rem 1.5rem' }}>
                <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Panel de Administración
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>Supervisión del sistema CarSale</p>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(equipo-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <StatCard icon={<Users size={24} color="#818cf8" />} label="Usuarios Totales" value={stats.userCount} color="#818cf8" />
                    <StatCard icon={<Building2 size={24} color="#34d399" />} label="Empresas" value={stats.orgCount} color="#34d399" />
                    <StatCard icon={<Crown size={24} color="#f59e0b" />} label="Plan Pro" value={orgs.filter(o => o.plan === 'pro').length} color="#f59e0b" />
                    <StatCard icon={<BarChart3 size={24} color="#f472b6" />} label="Plan Free" value={orgs.filter(o => o.plan === 'free').length} color="#f472b6" />
                </div>

                {/* WhatsApp Admin Session */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📱</span> WhatsApp Admin (Notificaciones)
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        Sesión dedicada para recibir alertas de nuevos registros. OrgId: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', color: '#a78bfa' }}>{ADMIN_ORG_ID}</code>
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <BotStatusBadge status={botStatus} />
                        <button onClick={handleCheckBotStatus} style={btnStyle('#6366f1')}>
                            <RefreshCw size={14} /> Verificar estado
                        </button>
                        {(botStatus === 'disconnected' || botStatus === 'idle') && (
                            <button onClick={handleConnectBot} style={btnStyle('#10b981')}>
                                Conectar WhatsApp
                            </button>
                        )}
                    </div>
                    {botStatus === 'qr' && qrData && (
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                Escaneá este código QR con tu WhatsApp
                            </p>
                            <img src={qrData} alt="QR Code" style={{ width: '200px', height: '200px', borderRadius: '0.75rem', background: '#fff', padding: '0.5rem' }} />
                        </div>
                    )}
                </div>

                {/* Organizations Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    overflow: 'hidden'
                }}>
                    <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={20} color="#a78bfa" /> Empresas Registradas
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    {['Empresa', 'Plan', 'Usuarios', 'Registrada', 'Acción'].map(h => (
                                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orgs.map(org => {
                                    const userCount = Array.isArray(org.profiles) ? org.profiles.reduce((acc, p: any) => acc + (p.count ?? 0), 0) : 0
                                    return (
                                        <tr key={org.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '0.875rem 1rem', color: '#fff', fontWeight: 500 }}>{org.name}</td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                    padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600,
                                                    background: org.plan === 'pro' ? 'rgba(245,158,11,0.2)' : 'rgba(107,114,128,0.2)',
                                                    color: org.plan === 'pro' ? '#fbbf24' : '#9ca3af',
                                                    border: `1px solid ${org.plan === 'pro' ? 'rgba(245,158,11,0.4)' : 'rgba(107,114,128,0.3)'}`
                                                }}>
                                                    {org.plan === 'pro' ? <Crown size={12} /> : null}
                                                    {org.plan === 'pro' ? 'PRO' : 'FREE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: 'rgba(255,255,255,0.7)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <Users size={13} /> {userCount}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <CalendarDays size={13} />
                                                    {format(new Date(org.created_at), "dd/MM/yyyy", { locale: es })}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <button
                                                    onClick={() => handleTogglePlan(org.id, org.plan)}
                                                    disabled={loadingOrgId === org.id}
                                                    style={{
                                                        padding: '0.35rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                                                        cursor: loadingOrgId === org.id ? 'not-allowed' : 'pointer',
                                                        border: 'none', transition: 'all 0.2s',
                                                        background: org.plan === 'free' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(107,114,128,0.3)',
                                                        color: org.plan === 'free' ? '#000' : '#9ca3af',
                                                        opacity: loadingOrgId === org.id ? 0.6 : 1
                                                    }}
                                                >
                                                    {loadingOrgId === org.id ? '...' : org.plan === 'free' ? '↑ Subir a PRO' : '↓ Bajar a FREE'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {orgs.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem' }}>No hay empresas registradas aún.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: `${color}22`, padding: '0.5rem', borderRadius: '0.5rem' }}>{icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{label}</div>
        </div>
    )
}

function BotStatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string, color: string, bg: string }> = {
        idle: { label: 'Sin verificar', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' },
        checking: { label: 'Verificando...', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
        connected: { label: '✅ Conectado', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
        disconnected: { label: '❌ Desconectado', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
        qr: { label: '📷 QR disponible', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    }
    const s = map[status] || map.idle
    return (
        <span style={{ padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.color}44` }}>
            {s.label}
        </span>
    )
}

function btnStyle(bg: string): React.CSSProperties {
    return {
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem',
        fontWeight: 600, border: 'none', cursor: 'pointer',
        background: bg, color: '#fff', transition: 'opacity 0.2s'
    }
}
