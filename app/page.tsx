'use client'

import Link from 'next/link'
import { Car, Bell, BarChart3, Building2, CreditCard, Wrench, Crown, CheckCircle2, XCircle, ArrowRight, Zap, Shield, Smartphone } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'

const features = [
  {
    icon: <Smartphone size={28} />,
    title: 'Inventario de Equipos',
    desc: 'Registrá y gestioná tus reparaciones con fotos, características, costos y estado en tiempo real.',
    color: '#ef4444' // Red
  },
  {
    icon: <CreditCard size={28} />,
    title: 'Ventas en Cuotas',
    desc: 'Creá planes de pago personalizados. El sistema genera las cuotas automáticamente.',
    color: '#34d399'
  },
  {
    icon: <Bell size={28} />,
    title: 'Notificaciones WhatsApp',
    desc: 'Recordatorios automáticos de vencimiento y recibos en PDF directo al cliente.',
    color: '#3b82f6' // Blue
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Reportes y Cobranzas',
    desc: 'Visualizá pagos pendientes, historial de cobros y exportá datos a Excel.',
    color: '#f472b6'
  },
  {
    icon: <Building2 size={28} />,
    title: 'Multi-empresa',
    desc: 'Manejá múltiples talleres desde un solo acceso con datos completamente aislados.',
    color: '#f87171' // Light Red
  },
  {
    icon: <Shield size={28} />,
    title: 'Seguridad y Control',
    desc: 'Roles de usuario, auditoría de cambios y eliminaciones para total trazabilidad.',
    color: '#60a5fa' // Light Blue
  },
]

const freeFeatures = [
  { included: true, text: 'Gestión de inventario' },
  { included: true, text: 'Ventas en cuotas' },
  { included: true, text: 'Registro de clientes' },
  { included: true, text: 'Reportes básicos' },
  { included: false, text: 'Notificaciones WhatsApp ilimitadas' },
  { included: false, text: 'Envío de recibos PDF por WA' },
  { included: false, text: 'Multi-empresa' },
  { included: false, text: 'Soporte prioritario' },
]

const proFeatures = [
  { included: true, text: 'Todo lo del plan Free' },
  { included: true, text: 'Notificaciones WhatsApp ilimitadas' },
  { included: true, text: 'Envío de recibos PDF por WA' },
  { included: true, text: 'Multi-empresa' },
  { included: true, text: 'Historial de notificaciones' },
  { included: true, text: 'Recordatorios automáticos' },
  { included: true, text: 'Soporte prioritario' },
  { included: true, text: 'Actualizaciones anticipadas' },
]

export default function LandingPage() {
  const posthog = usePostHog()

  const trackClick = (eventName: string, properties = {}) => {
    posthog.capture(eventName, properties)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#fff', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ───── NAV ───── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 2rem',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: 'linear-gradient(135deg, #ef4444, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', background: 'linear-gradient(135deg, #f87171, #60a5fa, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Reparar-Cel
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, padding: '0.4rem 0.75rem', borderRadius: '0.5rem', transition: 'color 0.2s' }}>
            Iniciar sesión
          </Link>
          <Link
            href="/registry"
            onClick={() => trackClick('landing_cta_nav_click')}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              color: '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
              padding: '0.45rem 1.1rem', borderRadius: '0.6rem',
              boxShadow: '0 0 20px rgba(239,68,68,0.4)',
              transition: 'all 0.2s'
            }}>
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section style={{ position: 'relative', padding: '6rem 2rem 5rem', textAlign: 'center', overflow: 'hidden' }}>
        {/* Glow effects - Red, White, Blue theme */}
        <div style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '100px', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50px', right: '10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: '9999px', padding: '0.35rem 1rem', marginBottom: '2rem',
            fontSize: '0.82rem', fontWeight: 600, color: '#93c5fd'
          }}>
            <Zap size={14} /> Sistema SaaS para tu taller de celulares
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Gestioná tus reparaciones{' '}
            <span style={{ background: 'linear-gradient(135deg, #ef4444, #ffffff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              con WhatsApp integrado
            </span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Control de stock, estados de reparación, garantías y notificaciones automáticas por WhatsApp. Todo en un solo lugar, listo para usar.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/registry"
              id="cta-register"
              onClick={() => trackClick('landing_cta_hero_click')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 700,
                padding: '0.8rem 2rem', borderRadius: '0.75rem',
                boxShadow: '0 0 40px rgba(239,68,68,0.5)',
                transition: 'all 0.2s'
              }}>
              Registrá tu empresa gratis <ArrowRight size={18} />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 600,
              padding: '0.8rem 2rem', borderRadius: '0.75rem',
              transition: 'all 0.2s'
            }}>
              Iniciar sesión
            </Link>
          </div>

          <p style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
            Sin tarjeta de crédito • Plan gratuito disponible • Configuración en minutos
          </p>
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Todo lo que necesitás en una{' '}
            <span style={{ background: 'linear-gradient(135deg, #ef4444, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              sola plataforma
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', maxWidth: '550px', margin: '0 auto' }}>
            Diseñado específicamente para talleres de reparación de celulares del mercado local.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '1rem', padding: '1.75rem',
              transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden'
            }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,0.07)'
                el.style.borderColor = `${f.color}40`
                el.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,0.04)'
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '0.75rem', background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: f.color }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#fff' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── WHATSAPP HIGHLIGHT ───── */}
      <section style={{ padding: '3rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(37,211,102,0.03))',
          border: '1px solid rgba(37,211,102,0.25)',
          borderRadius: '1.5rem', padding: '3rem 2.5rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '9999px', padding: '0.3rem 0.9rem', marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#4ade80' }}>
              <Smartphone size={13} /> Notificaciones WhatsApp
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Tus clientes reciben recordatorios{' '}
              <span style={{ color: '#4ade80' }}>directo en WhatsApp</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              El sistema envía automáticamente recordatorios de cuotas vencidas con el resumen de lo que deben, y genera recibos en PDF que se envían al momento del cobro.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Recordatorio el día del vencimiento', 'Resumen de cuotas morosas', 'Recibo PDF al cobrar', 'Historial de mensajes enviados'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} color="#4ade80" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { from: 'Sistema', msg: '🔔 Hola Juan, su cuota N° 3 de su Toyota Hilux vence hoy por Gs. 1.200.000. ¡Gracias por su puntualidad!', time: '09:00' },
              { from: 'Sistema', msg: '📄 Adjunto su recibo de pago de cuota N° 3. Monto abonado: Gs. 1.200.000.', time: '10:32' },
            ].map((m, i) => (
              <div key={i} style={{
                background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.2)',
                borderRadius: '0.75rem 0.75rem 0.75rem 0', padding: '0.875rem 1rem', maxWidth: '340px'
              }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0 }}>{m.msg}</p>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: '0.4rem' }}>{m.time} ✓✓</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PRICING ───── */}
      <section id="precios" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Planes simples y transparentes
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>Empezá gratis. Actualizá cuando necesitás más poder.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Free */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.25rem', padding: '2rem'
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.25rem' }}>Free</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Para comenzar</p>
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>Gs. 0</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}> / mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
              {freeFeatures.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: f.included ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)' }}>
                  {f.included ? <CheckCircle2 size={15} color="#4ade80" /> : <XCircle size={15} color="rgba(255,255,255,0.2)" />}
                  {f.text}
                </li>
              ))}
            </ul>
            <Link
              href="/registry"
              onClick={() => trackClick('landing_cta_pricing_free_click')}
              style={{
                display: 'block', textAlign: 'center', padding: '0.7rem',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', textDecoration: 'none', borderRadius: '0.6rem', fontWeight: 600, fontSize: '0.9rem'
              }}>
              Empezar gratis
            </Link>
          </div>

          {/* Pro */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(59,130,246,0.1))',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '1.25rem', padding: '2rem', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Crown size={11} /> POPULAR
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.25rem', color: '#fca5a5' }}>Pro</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Para crecer sin límites</p>
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fca5a5' }}>A convenir</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
              {proFeatures.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>
                  <CheckCircle2 size={15} color="#ef4444" />
                  {f.text}
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/595961853895"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('landing_cta_pricing_pro_click')}
              style={{
                display: 'block', textAlign: 'center', padding: '0.7rem',
                background: 'linear-gradient(135deg, #ef4444, #1d4ed8)',
                color: '#fff', textDecoration: 'none', borderRadius: '0.6rem', fontWeight: 700, fontSize: '0.9rem',
                boxShadow: '0 0 30px rgba(239,68,68,0.3)'
              }}>
              Contactar para contratar
            </a>
          </div>
        </div>
      </section>

      {/* ───── CTA FINAL ───── */}
      <section style={{ padding: '4rem 2rem 6rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Empezá a ordenar tu negocio{' '}
            <span style={{ background: 'linear-gradient(135deg, #ef4444, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              hoy mismo
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Registrá tu empresa en menos de 2 minutos. Sin tarjeta de crédito, sin compromisos.
          </p>
          <Link
            href="/registry"
            id="cta-register-bottom"
            onClick={() => trackClick('landing_cta_footer_click')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              background: 'linear-gradient(135deg, #ef4444, #1d4ed8)',
              color: '#fff', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 700,
              padding: '0.9rem 2.5rem', borderRadius: '0.875rem',
              boxShadow: '0 0 50px rgba(239,68,68,0.4)',
            }}>
            Crear mi empresa gratis <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>
          © 2026 Reparar-Cel · Sistema de gestión para talleres
        </p>
      </footer>
    </div>
  )
}


