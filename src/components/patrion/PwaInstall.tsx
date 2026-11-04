import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Share, PlusSquare, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { PatrionLogo } from './PatrionLogo';
import { isPreviewHost, shouldOfferInstall } from '@/lib/pwa';
interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
const InstallContext = createContext({ openInstall: () => {}, installed: false });
const DISMISSED = 'patrion-install-dismissed';
const INSTALLED = 'patrion-installed';
function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Works without storage. */ } }
export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const prompt = useRef<InstallEvent | null>(null);
  const [native, setNative] = useState(false);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const standalone = () => media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone() || read(INSTALLED) === '1');
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setPlatform(ios ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop');
    const eligible = () => window.self === window.top && !isPreviewHost(window.location.hostname)
      && shouldOfferInstall(standalone() || read(INSTALLED) === '1', Number(read(DISMISSED)) || 0, Date.now());
    const before = (event: Event) => { event.preventDefault(); prompt.current = event as InstallEvent; setNative(true); if (eligible()) setOpen(true); };
    const completed = () => { write(INSTALLED, '1'); setInstalled(true); setOpen(false); setNative(false); prompt.current = null; };
    const changed = () => { if (standalone()) completed(); };
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', completed);
    media.addEventListener('change', changed);
    const timer = window.setTimeout(() => { if (eligible()) setOpen(true); }, 2500);
    return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', completed); media.removeEventListener('change', changed); };
  }, []);
  function close() { setOpen(false); write(DISMISSED, String(Date.now())); }
  async function install() {
    const event = prompt.current;
    if (!event) return;
    setBusy(true); setError('');
    try {
      await event.prompt();
      const choice = await event.userChoice;
      // Acceptance alone is not proof of installation.
      if (choice.outcome === 'dismissed') close(); else setOpen(false);
    } catch { setError('Não foi possível abrir a instalação. Use o menu do navegador para instalar.'); }
    finally { prompt.current = null; setNative(false); setBusy(false); }
  }
  return <InstallContext.Provider value={{ installed, openInstall: () => { setError(''); setOpen(true); } }}>
    {children}
    <Dialog open={open && !installed} onOpenChange={value => { if (!value) close(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg border-border bg-background p-6 motion-reduce:animate-none">
        <PatrionLogo size={64} state="intro" className="mx-auto" />
        <DialogTitle className="text-center font-display text-2xl leading-tight tracking-normal">Tenha o PATRION sempre com você.</DialogTitle>
        <DialogDescription className="text-center leading-relaxed">Instale o aplicativo e tenha sua gestão financeira disponível diretamente na tela inicial do seu dispositivo.</DialogDescription>
        {!native && <ol className="space-y-3 border-y border-border py-4 text-sm text-muted-foreground">
          {platform === 'ios' ? <><li className="flex gap-3"><Share className="size-5 shrink-0 text-primary" />Abra o PATRION no Safari e toque em Compartilhar.</li><li className="flex gap-3"><PlusSquare className="size-5 shrink-0 text-primary" />Escolha “Adicionar à Tela de Início” e confirme em “Adicionar”.</li></> : <><li className="flex gap-3"><Menu className="size-5 shrink-0 text-primary" />Abra o menu do navegador.</li><li className="flex gap-3"><Download className="size-5 shrink-0 text-primary" />{platform === 'android' ? 'Escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.' : 'Procure “Instalar PATRION” na barra de endereço ou no menu do Chrome ou Edge.'}</li><li>Se essa opção não aparecer, este navegador não oferece instalação. Abra no Chrome ou Edge.</li></>}
        </ol>}
        {error && <p role="alert" className="text-sm text-muted-foreground">{error}</p>}
        {native && <Button className="w-full" disabled={busy} onClick={() => void install()}><Download />{busy ? 'ABRINDO…' : 'INSTALAR APLICATIVO'}</Button>}
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={close}>AGORA NÃO</Button>
      </DialogContent>
    </Dialog>
  </InstallContext.Provider>;
}
export function PwaInstallButton() {
  const { installed, openInstall } = useContext(InstallContext);
  return <Button variant="outline" className="w-full" onClick={openInstall} disabled={installed}><Download />{installed ? 'Aplicativo instalado' : 'Instalar aplicativo'}</Button>;
}
