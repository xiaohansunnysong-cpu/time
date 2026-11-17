import { AppNav } from "@/components/AppNav"
import { HomeScreen } from "@/components/HomeScreen"
import { MineScreen } from "@/components/MineScreen"
import { PlazaScreen } from "@/components/PlazaScreen"
import { Ritual } from "@/components/temple/Ritual"
import { StoryScreen } from "@/components/StoryScreen"
import { SurpriseSheet } from "@/components/SurpriseSheet"
import { Toaster } from "@/components/ui/sonner"
import { AppProvider, useApp } from "@/state/app-state"

function Shell() {
  const { view, ritual, endRitual } = useApp()

  return (
    <div className="temple-root relative min-h-svh">
      <div className="candle-glow" aria-hidden />
      <main className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-4 pt-6 pb-32">
        {view === "draw" ? <HomeScreen /> : null}
        {view === "plaza" ? <PlazaScreen /> : null}
        {view === "log" ? <StoryScreen /> : null}
        {view === "mine" ? <MineScreen /> : null}
      </main>
      <AppNav />
      <SurpriseSheet />
      {ritual ? <Ritual slip={ritual.slip} onDone={endRitual} /> : null}
      <Toaster position="top-center" />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
