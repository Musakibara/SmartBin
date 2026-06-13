import { useEffect, useRef, useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import {
    BadgeCheck, ArrowRight, Trash2, BatteryCharging,
    Radio, Brain, Bell, Route, Settings, LayoutDashboard,
    Antenna, Cpu, CloudUpload, BarChart3, CheckCircle,
    Globe, Share2, Menu, X
} from 'lucide-react'

function Welcome() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const scrolledRef = useRef(false)
    const headerRef = useRef<HTMLElement>(null)

    useEffect(() => {
        function handleScroll() {
            const isScrolled = window.scrollY > 50
            if (isScrolled !== scrolledRef.current) {
                scrolledRef.current = isScrolled
                if (!headerRef.current) return
                if (isScrolled) {
                    headerRef.current.classList.add('py-2', 'shadow-md')
                    headerRef.current.classList.remove('py-[8px]')
                } else {
                    headerRef.current.classList.remove('py-2', 'shadow-md')
                    headerRef.current.classList.add('py-[8px]')
                }
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            { threshold: 0.1 }
        )

        document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    const stats = [
        { value: '98%', label: 'Accuracy', desc: 'AI-driven fill detection with precision sensors.' },
        { value: '35%', label: 'Cost Reduc.', desc: 'Average reduction in logistical overhead.' },
        { value: '24/7', label: 'Monitoring', desc: 'Continuous uptime and health checks.' },
        { value: '100+', label: 'Active Bins', desc: 'Scalable infrastructure for city grids.' },
    ]

    const features = [
        { icon: Radio, title: 'Real-Time Monitoring', desc: 'Instant telemetry for fill levels, temperature, and tilt angles across your entire network.', color: 'text-[#006c49]', bg: 'bg-[#006c49]/10' },
        { icon: Brain, title: 'AI Predictions', desc: 'Proprietary ML models forecast overflow risk based on seasonal data and local events.', color: 'text-[#4059aa]', bg: 'bg-[#4059aa]/10' },
        { icon: Bell, title: 'Smart Alerts', desc: 'Automated SMS and email notifications for immediate intervention during high-demand periods.', color: 'text-[#006c49]', bg: 'bg-[#006c49]/10' },
        { icon: Route, title: 'Route Optimization', desc: 'Reduce carbon footprint by generating the most efficient pickup paths dynamically.', color: 'text-[#4059aa]', bg: 'bg-[#4059aa]/10' },
        { icon: Settings, title: 'Automated Lid Control', desc: 'Remote locking and lid management to prevent illegal dumping or environmental hazards.', color: 'text-[#006c49]', bg: 'bg-[#006c49]/10' },
        { icon: LayoutDashboard, title: 'Analytics Dashboard', desc: 'Granular reports on recycling rates and operational efficiency for government compliance.', color: 'text-[#4059aa]', bg: 'bg-[#4059aa]/10' },
    ]

    const steps = [
        { icon: Antenna, title: '1. Sensors', desc: 'Ultrasonic & TOF sensors measure waste levels with 1mm precision.' },
        { icon: Cpu, title: '2. ESP32 Hub', desc: 'Low-power micro-controllers process raw data locally at the edge.' },
        { icon: CloudUpload, title: '3. Cloud Mesh', desc: 'Encrypted MQTT protocols transmit data to our secure data lake.' },
        { icon: BarChart3, title: '4. Dashboard', desc: 'Instant visualization and route planning on your enterprise portal.' },
    ]

    return (
        <div className="bg-[#f7f9fb] text-[#191c1e] font-inter overflow-x-hidden">
            <Head title="SmartBin | Smart Waste Infrastructure">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist:wght@400;500;600&display=swap" rel="stylesheet" />
            </Head>

            <header
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 md:px-[40px] py-[8px] max-w-[1440px] mx-auto backdrop-blur-md border-b border-[#bbcabf] bg-[#f7f9fb]/80 transition-all duration-300"
            >
                <div className="flex items-center gap-2 sm:gap-[8px]">
                    <img src="/images/logo.png" alt="SmartBin" className="h-8 w-8 sm:h-12 sm:w-12 rounded" />
                    <span className="text-[18px] sm:text-[24px] font-semibold leading-[32px] text-[#006c49]">SmartBin</span>
                </div>

                <nav className="hidden md:flex items-center gap-[24px]">
                    <a href="#" className="text-[#006c49] font-semibold border-b-2 border-[#006c49] text-[16px] leading-[24px] py-[4px]">Home</a>
                    <a href="#features" className="text-[#3c4a42] hover:text-[#006c49] transition-colors text-[16px] leading-[24px]">Features</a>
                    <a href="#architecture" className="text-[#3c4a42] hover:text-[#006c49] transition-colors text-[16px] leading-[24px]">Architecture</a>
                    <a href="#dashboard" className="text-[#3c4a42] hover:text-[#006c49] transition-colors text-[16px] leading-[24px]">Solution</a>
                </nav>

                <div className="flex items-center gap-2 sm:gap-[16px]">
                    <span className="hidden lg:block text-[#3c4a42] text-[14px] leading-[20px] font-medium tracking-[0.01em] cursor-pointer hover:text-[#006c49] transition-colors">Support</span>
                    <Link
                        href="/signup"
                        className="bg-[#006c49] hover:bg-[#10b981] text-white px-4 sm:px-6 py-2 rounded-xl text-[14px] leading-[20px] font-bold tracking-[0.01em] active:scale-95 transition-transform"
                    >
                        Get Started
                    </Link>
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-[#3c4a42]" aria-label="Menu">
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile nav overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <nav className="absolute top-0 right-0 w-72 h-full bg-[#f7f9fb] shadow-2xl p-8 pt-24 flex flex-col gap-6">
                        {[
                            { href: '#', label: 'Home' },
                            { href: '#features', label: 'Features' },
                            { href: '#architecture', label: 'Architecture' },
                            { href: '#dashboard', label: 'Solution' },
                        ].map(({ href, label }) => (
                            <a key={label} href={href} onClick={() => setMobileOpen(false)}
                                className="text-[#3c4a42] hover:text-[#006c49] text-lg font-semibold transition-colors border-b border-[#bbcabf] pb-3"
                            >{label}</a>
                        ))}
                        <div className="mt-auto pt-6 border-t border-[#bbcabf]">
                            <span className="block text-[#3c4a42] text-sm mb-4">Support</span>
                            <Link href="/signup" onClick={() => setMobileOpen(false)}
                                className="block text-center bg-[#006c49] text-white px-6 py-3 rounded-xl font-bold"
                            >Get Started</Link>
                        </div>
                    </nav>
                </div>
            )}

            <main className="pt-[80px]">
                <section className="relative md:min-h-[90vh] flex items-center px-4 sm:px-6 md:px-[40px] py-6 md:py-[48px] max-w-[1440px] mx-auto hero-gradient">
                    <div className="grid lg:grid-cols-2 gap-[48px] items-center w-full">
                        <div className="flex flex-col gap-[24px] z-10">
                            <div className="inline-flex items-center gap-[8px] bg-[#10b981]/10 text-[#10b981] px-4 py-1 rounded-full w-fit">
                                <BadgeCheck size={18} />
                                <span className="text-[12px] leading-[16px] font-semibold uppercase tracking-wider">Public Infrastructure Edition 2024</span>
                            </div>

                            <h1 className="text-[32px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#191c1e] max-w-xl">
                                Transform Waste Management with <span className="text-[#006c49]">AI and IoT</span>
                            </h1>

                            <p className="text-[18px] leading-[28px] text-[#6c7a71] max-w-lg">
                                Monitor smart waste bins in real time, optimize collection routes with predictive intelligence, and achieve 100% operational transparency for smarter city ecosystems.
                            </p>

                            <div className="flex flex-wrap gap-[16px] pt-[8px]">
                                <Link
                                    href="/login"
                                    className="bg-[#006c49] text-white px-8 py-4 rounded-xl text-[14px] leading-[20px] font-bold tracking-[0.01em] flex items-center gap-[8px] hover:shadow-lg active:scale-95 transition-all"
                                >
                                    Explore Dashboard
                                    <ArrowRight size={20} />
                                </Link>
                                <button className="border border-[#4059aa] text-[#4059aa] px-8 py-4 rounded-xl text-[14px] leading-[20px] font-bold tracking-[0.01em] hover:bg-[#4059aa]/5 active:scale-95 transition-all">
                                    Watch Demo
                                </button>
                            </div>

                            <div className="flex items-center gap-[16px] mt-[16px]">
                                <div className="flex -space-x-3">
                                    <img
                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfg28kSoN0bANhG4BcTaYOQU7a9EUy2bHOcoiSfb88s68nURHVQ--J-CaJMc41O8HeD2nLfY_ieXoyXOr6MzfSTsgu57cRowVYgt_Tr5VXduYnzP-H2gKNVPhU4_oLGbgbKn1hS8tFAHTfhNW6cLHgDQoc22Qa9X1qj5wA6nERwaNqSzr3JG_K98Piz0KGnF4IGBT87Fp_zTBiFnT1Uwdh3Ge51nH8v6gybOp4bEZtLTAkGz7DifCIJ6RL5LXXxMX2-5xZ0WXkxGs"
                                        alt=""
                                    />
                                    <img
                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl-IlotepTOyF0Vh7MneXl5AplIOrzQ2Wu9hpvrltHVc8z2pzc2ugo3wNrOlmUrQ-gXF-Lw94EaVLN5hs8hjzmh3AQxS0S6jQNYh9f1WDw8jZB_ard62UME_KsGO33x34rRdz0gEn5X0sUcq0cIVSsM7fXZLnfs3KA5cYHOSSBj6IGMWRyJ5h80xUbQfVVeAIHK-4VBA6iQ1n7g91AiJwL5Os5XMzfBO3M5IBcOIqDDF2HgdOGMh4Bd_YHajyxV0RM1wZ4I6BwOyA"
                                        alt=""
                                    />
                                    <img
                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVSyGcczuolVD0GCVKkawtsn5vPGDhr3JYMkAVzrFtnFYP4pdZREAYE61--u5fiKtbiza95M3uokQrbAci8Ldu9xwD5E9WMyVFd007wNVoD-VhjtklQKxZHIvTOMUAN74L2CmRZtgS4NUJRIOYdJSxjP6yyWXGDhA3f8ikRNVMr5oL2JWOza-flx_DSaSWoffmPecGsOGCWgdkEyXw90wjXhysFfWsfFYTDOuHUSOwQLdAsn7SSL7azw5RCnTsyk1ViAwpkb3rfAg"
                                        alt=""
                                    />
                                </div>
                                <p className="text-[#6c7a71] text-[14px] leading-[20px] font-medium tracking-[0.01em]">
                                    Trusted by <span className="text-[#191c1e] font-bold">50+ Municipalities</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative w-full aspect-square md:aspect-video lg:aspect-auto h-full min-h-[280px] md:min-h-[500px]">
                            <div className="absolute inset-0 rounded-[32px] overflow-hidden shadow-2xl border border-[#bbcabf]/30">
                                <img
                                    className="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcmIL5ppI4Y8IaINTulT5itT3UQ8Io5op3fM3wCER2JlWErKj5ANpv6D6I4ctprbqJPfsN7R4DAZbcZgOkpvD3Q_q1cJye8YYoeIRId5t0kktH56QExRyL5ZiWsm-baY-28FaUshxhRawrsQYkg5avmAJGFAdb3xtAUQ41-PVg8L1x1OC3-R3k-tYW9Sw5qHWaLmMaH0-XLZzFN1kF-wC1IMaEz008VYxNkviCVwfKBpOep2022lPN8PgVufOkvPRqKpOPIvmXjGU"
                                    alt="Smart City"
                                />

                                <div className="absolute top-12 left-12 glass-card p-4 rounded-xl flex items-center gap-[16px] animate-bounce" style={{ animationDuration: '3s' }}>
                                    <div className="bg-[#006c49]/10 p-2 rounded-lg text-[#006c49]">
                                        <Trash2 size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[12px] leading-[16px] font-semibold text-[#3c4a42]">Fill Level</p>
                                        <p className="text-[24px] leading-[32px] font-semibold text-[#006c49]">85%</p>
                                    </div>
                                </div>

                                <div className="absolute bottom-20 right-12 glass-card p-4 rounded-xl flex items-center gap-[16px] animate-bounce" style={{ animationDuration: '4s' }}>
                                    <div className="bg-[#4059aa]/10 p-2 rounded-lg text-[#4059aa]">
                                        <BatteryCharging size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[12px] leading-[16px] font-semibold text-[#3c4a42]">Battery</p>
                                        <p className="text-[24px] leading-[32px] font-semibold text-[#4059aa]">92%</p>
                                    </div>
                                </div>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card p-3 rounded-full flex items-center gap-2 border-[#006c49]/40 shadow-xl">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c49] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#006c49]"></span>
                                    </span>
                                    <span className="text-[12px] leading-[16px] font-bold text-[#191c1e]">Live Bin-042</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-6 md:py-[48px] px-4 sm:px-6 md:px-[40px] max-w-[1440px] mx-auto animate-on-scroll">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-[24px]">
                        {stats.map((s) => (
                            <div key={s.label} className="bg-[#f2f4f6] p-4 md:p-8 rounded-2xl border border-[#bbcabf] hover:border-[#006c49] transition-colors group">
                                <p className="text-[#006c49] text-[32px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] mb-2">{s.value}</p>
                                <p className="text-[18px] md:text-[24px] leading-[32px] font-semibold text-[#191c1e]">{s.label}</p>
                                <p className="text-[#6c7a71] mt-2 text-[14px] md:text-[16px] leading-[24px]">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-6 md:py-[48px] px-4 sm:px-6 md:px-[40px] max-w-[1440px] mx-auto" id="features">
                    <div className="text-center mb-6 md:mb-[48px] animate-on-scroll">
                        <h2 className="text-[30px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#191c1e]">Comprehensive AI Suite</h2>
                        <p className="text-[18px] leading-[28px] text-[#6c7a71] mt-[8px] max-w-2xl mx-auto">Enterprise-grade tools designed for the next generation of urban sanitation.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
                        {features.map((f) => (
                            <div key={f.title} className="glass-card p-8 rounded-2xl hover:scale-[1.02] transition-transform animate-on-scroll">
                                <div className={`w-12 h-12 ${f.bg} ${f.color} flex items-center justify-center rounded-xl mb-6`}>
                                    <f.icon size={32} />
                                </div>
                                <h3 className="text-[24px] leading-[32px] font-semibold text-[#191c1e] mb-3">{f.title}</h3>
                                <p className="text-[#6c7a71] text-[16px] leading-[24px]">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-6 md:py-[48px] bg-white overflow-hidden" id="architecture">
                    <div className="px-4 sm:px-6 md:px-[40px] max-w-[1440px] mx-auto">
                        <div className="text-center mb-6 md:mb-[48px] animate-on-scroll">
                            <h2 className="text-[30px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#191c1e]">Seamless Architecture</h2>
                            <p className="text-[18px] leading-[28px] text-[#6c7a71] mt-[8px]">From physical signals to actionable insights in milliseconds.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-[24px] relative">
                            {steps.map((s, i) => (
                                <div key={s.title} className="flex flex-col items-center text-center group animate-on-scroll">
                                    <div className="relative">
                                        <div className="w-20 h-20 bg-[#006c49] text-white rounded-full flex items-center justify-center mb-6 shadow-lg z-10 relative">
                                            <s.icon size={32} />
                                        </div>
                                        {i < steps.length - 1 && <div className="step-connector-line" />}
                                    </div>
                                    <h4 className="text-[24px] leading-[32px] font-bold text-[#191c1e] mb-2">{s.title}</h4>
                                    <p className="text-[#6c7a71] text-[16px] leading-[24px] px-4">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-6 md:py-[48px] px-4 sm:px-6 md:px-[40px] max-w-[1440px] mx-auto" id="dashboard">
                    <div className="bg-[#2d3133] rounded-2xl md:rounded-[40px] p-4 md:p-8 lg:p-16 shadow-2xl relative overflow-hidden group animate-on-scroll">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                        <div className="relative z-10 grid lg:grid-cols-12 gap-[24px] items-center">
                            <div className="lg:col-span-4 text-[#eff1f3]">
                                <h2 className="text-[30px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] mb-[16px]">Master Control for Your Entire Fleet</h2>
                                <p className="text-[18px] leading-[28px] text-[#e0e3e5] mb-[24px]">Our dark-mode optimized dashboard provides a 360° view of city waste distribution, vehicle health, and operational KPIs.</p>
                                <ul className="space-y-4 mb-[24px]">
                                    {['Multi-user role management', 'Live vehicle GPS tracking', 'Historical trend reporting'].map((item) => (
                                        <li key={item} className="flex items-center gap-3">
                                            <CheckCircle className="text-[#6ffbbe]" size={22} />
                                            <span className="text-[16px] leading-[24px]">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="lg:col-span-8">
                                <div className="bg-[#d8dadc]/20 rounded-2xl p-4 border border-[#6c7a71]/30 backdrop-blur-sm">
                                    <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
                                        <div className="bg-[#334155] px-6 py-3 flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#ba1a1a]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#4059aa]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#006c49]"></div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-32 h-6 bg-[#475569] rounded-full"></div>
                                                <div className="w-8 h-8 rounded-full bg-[#475569]"></div>
                                            </div>
                                        </div>

                                        <div className="p-6 grid grid-cols-12 gap-4">
                                            <div className="col-span-4 space-y-4">
                                                <div className="h-32 bg-[#334155] rounded-xl p-4">
                                                    <div className="w-1/2 h-2 bg-[#006c49]/40 rounded-full mb-2"></div>
                                                    <div className="w-3/4 h-6 bg-[#10b981]/20 rounded-lg"></div>
                                                </div>
                                                <div className="h-48 bg-[#334155] rounded-xl overflow-hidden">
                                                    <img
                                                        className="w-full h-full object-cover opacity-80"
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpgh2QjyfuTxVUfg82xIM38ugGIgc2bXaCSUGeq4Znyrw6kqbHZSHbfGw_ffhCyMQAL0mocqrtzNZsTX5leFU5wVT0Aq-iIqaBjWjO7rEeHxSpSc51x_V0BUXsUVbE_P7A4bzEDFMM5K-10JvMKW9HmxP5Fb4BVUG0IC2-BDGYP7XGGuo44omilfkWDY05iSDnbU37JYCgsdiMAX4kYaS9yYSNX0vwnxpWACQdhtSqXOmBA4HAwm1RS6skcjD2VwdjaMSfuWny3HQ"
                                                        alt=""
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-8 bg-[#334155] rounded-xl min-h-[250px] relative">
                                                <div className="absolute inset-0 p-4">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="w-32 h-4 bg-[#6c7a71]/40 rounded-full"></div>
                                                        <div className="flex gap-2">
                                                            <div className="w-4 h-4 bg-[#006c49] rounded-full"></div>
                                                            <div className="w-4 h-4 bg-[#4059aa] rounded-full"></div>
                                                        </div>
                                                    </div>
                                                    <img
                                                        className="w-full h-full object-cover rounded-lg"
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLH3ZuOqvj3X8hOpk22rC8IWHlpcpY_6R9R0YiGh8lZBhfBp-1lMi87UeK-5OFno_OGsfutxkiQivP0aozA9fgU0EBdFw0bQ6UaM282oEcW4pxJ8KeKdI58PZZ2P974M3ifeKfPfV-DQd8HNTx_-0BfHGIKoTTaW59f6o2pjI4ay1W6U-fm_d0Nt-pusTGdVPtcV_X2BbIgs7FltPqHDf_an9qGaYHAnfwyz6wqS1yb5TiF7SDNrp8zSFhAKzUCiAGsshm7c-JVIY"
                                                        alt=""
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-6 md:py-[48px] px-4 sm:px-6 md:px-[40px] max-w-[1440px] mx-auto text-center animate-on-scroll">
                    <div className="bg-[#006c49] p-6 md:p-12 lg:p-24 rounded-2xl md:rounded-[40px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#6ffbbe]/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                        <h2 className="text-[24px] md:text-[32px] lg:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] mb-4 md:mb-[16px] relative z-10">Ready to Build Smarter Cities?</h2>
                        <p className="text-[16px] md:text-[18px] leading-[28px] opacity-90 max-w-2xl mx-auto mb-6 md:mb-[48px] relative z-10">Join forward-thinking governments and industrial leaders in redefining urban sanitation infrastructure.</p>
                        <div className="flex flex-wrap justify-center gap-3 md:gap-[16px] relative z-10">
                            <button className="bg-white text-[#006c49] px-6 md:px-10 py-3 md:py-5 rounded-xl text-[16px] md:text-[24px] leading-[32px] font-semibold hover:bg-[#f2f4f6] active:scale-95 transition-all shadow-xl">
                                Schedule a Demo
                            </button>
                            <button className="bg-[#002113] text-white px-6 md:px-10 py-3 md:py-5 rounded-xl text-[16px] md:text-[24px] leading-[32px] font-semibold hover:bg-[#005236] active:scale-95 transition-all">
                                Contact Sales
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="w-full py-4 md:py-[24px] px-4 sm:px-6 md:px-[40px] flex flex-col md:flex-row justify-between items-center gap-4 md:gap-[16px] bg-[#eceef0] border-t border-[#bbcabf]">
                <div className="flex flex-col gap-2 items-center md:items-start">
                    <div className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="SmartBin" className="h-12 w-12 rounded" />
                        <span className="text-[14px] leading-[20px] font-bold tracking-[0.01em] text-[#191c1e]">SmartBin</span>
                    </div>
                    <p className="text-[#6c7a71] max-w-xs text-center md:text-left text-[12px] leading-[16px] font-semibold">© 2024 SmartBin. All rights reserved. Government-grade infrastructure security.</p>
                </div>

                <div className="flex flex-wrap justify-center gap-[24px] text-[12px] leading-[16px] font-semibold">
                    {['Privacy Policy', 'Terms of Service', 'Security Compliance', 'Status'].map((item) => (
                        <a key={item} href="#" className="text-[#6c7a71] hover:text-[#006c49] transition-colors">{item}</a>
                    ))}
                </div>

                <div className="flex items-center gap-[16px]">
                    <div className="p-2 rounded-full border border-[#bbcabf] text-[#6c7a71] hover:text-[#006c49] cursor-pointer transition-colors">
                        <Globe size={16} />
                    </div>
                    <div className="p-2 rounded-full border border-[#bbcabf] text-[#6c7a71] hover:text-[#006c49] cursor-pointer transition-colors">
                        <Share2 size={16} />
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Welcome
