import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, Mail, Phone, ShieldCheck, FileText } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type HelpSection = "faq" | "support" | "terms" | "privacy";

const sections = {
  faq: { title: "Ko‘p so‘raladigan savollar", icon: HelpCircle },
  support: { title: "Qo‘llab-quvvatlash", icon: Phone },
  terms: { title: "Foydalanish qoidalari", icon: FileText },
  privacy: { title: "Maxfiylik", icon: ShieldCheck },
};

const questions = [
  { question: "Mahsulotlarni qayerdan topaman?", answer: <>Mahsulotlarni <Link className="text-primary underline" to="/marketplace">Bozor</Link> sahifasida ko‘rishingiz mumkin.</> },
  { question: "Buyurtmalarimni qayerda ko‘raman?", answer: <>Hisobingizga kirgach, <Link className="text-primary underline" to="/orders">Buyurtmalar</Link> sahifasini oching.</> },
  { question: "Parolimni unutdim. Nima qilaman?", answer: <><Link className="text-primary underline" to="/forgot-password">Parolni tiklash</Link> sahifasida emailingizni kiriting va xatdagi havolani oching. Xat kelmasa, spam papkasini ham tekshiring.</> },
  { question: "Fermer sifatida qanday ariza beraman?", answer: <>Hisobingizga kirib, <Link className="text-primary underline" to="/farmer/apply">Fermer arizasi</Link> sahifasini to‘ldiring.</> },
  { question: "Yordam uchun kimga murojaat qilaman?", answer: <><Link className="text-primary underline" to="/support">Qo‘llab-quvvatlash</Link> sahifasidagi telefon yoki email orqali bog‘laning.</> },
];

export default function Help({ section }: { section: HelpSection }) {
  const { title, icon: Icon } = sections[section];

  useEffect(() => { window.scrollTo(0, 0); }, [section]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Button asChild variant="ghost" className="mb-8">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Bosh sahifa</Link>
        </Button>
        <Icon className="mb-4 h-9 w-9 text-primary" />
        <h1 className="mb-8 text-3xl font-bold">{title}</h1>
        <nav aria-label="Yordam bo‘limlari" className="mb-8 flex flex-wrap gap-x-6 gap-y-3 border-b border-border pb-5">
          {Object.entries(sections).map(([key, item]) => (
            <Link key={key} to={`/${key}`} aria-current={key === section ? "page" : undefined}
              className={key === section ? "font-semibold text-primary underline underline-offset-4" : "text-muted-foreground hover:text-primary"}>
              {key === "faq" ? "FAQ" : item.title}
            </Link>
          ))}
        </nav>
        {section === "faq" && (
          <Accordion type="single" collapsible>
            {questions.map((item, index) => (
              <AccordionItem key={index} value={`question-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        {section === "support" && (
          <div className="space-y-6">
            <p className="text-muted-foreground">FarmTrade bo‘yicha savol yoki muammo yuzaga kelsa, biz bilan bog‘laning.</p>
            <div className="flex flex-col items-start gap-4">
              <Button asChild variant="outline"><a href="tel:+998948165566"><Phone className="mr-2 h-4 w-4" />+998 94 816 55 66</a></Button>
              <a className="flex max-w-full items-center gap-2 text-primary underline underline-offset-4" href="mailto:mahmudovmurodjon111@gmail.com">
                <Mail className="h-4 w-4 shrink-0" /><span className="break-all">mahmudovmurodjon111@gmail.com</span>
              </a>
            </div>
            <p className="text-muted-foreground">Murojaatingizda muammo yuz bergan sahifa va holatni yozing. Parolingizni yoki karta xavfsizlik kodini yubormang.</p>
          </div>
        )}
        {section === "terms" && (
          <div className="space-y-6 leading-relaxed">
            <p className="border-l-2 border-primary pl-4 text-muted-foreground">Quyidagi ma’lumotlar umumiy tavsiyalar. Rasmiy foydalanish shartlari platforma egasi tomonidan tasdiqlangach e’lon qilinadi.</p>
            <section><h2 className="mb-2 text-xl font-semibold">Savdo ma’lumotlari</h2><p>Mahsulot narxi, miqdori, sifati va yetkazib berish shartlarini kelishuvdan oldin sotuvchi bilan aniqlashtiring.</p></section>
            <section><h2 className="mb-2 text-xl font-semibold">Hisob xavfsizligi</h2><p>Hisobingiz parolini boshqalarga bermang. E’lon va yozishmalarda haqqoniy ma’lumotlardan foydalaning.</p></section>
            <section><h2 className="mb-2 text-xl font-semibold">Savollar va nizolar</h2><p>Buyurtmaga oid muammo bo‘lsa, buyurtma ma’lumotlari bilan <Link to="/support" className="text-primary underline">qo‘llab-quvvatlash xizmatiga</Link> murojaat qiling.</p></section>
          </div>
        )}
        {section === "privacy" && (
          <div className="space-y-6 leading-relaxed">
            <p className="border-l-2 border-primary pl-4 text-muted-foreground">Bu bo‘limda umumiy xavfsizlik ma’lumotlari berilgan. Rasmiy maxfiylik siyosati platforma egasi tomonidan tasdiqlangach e’lon qilinadi.</p>
            <section><h2 className="mb-2 text-xl font-semibold">Shaxsiy ma’lumotlar</h2><p>FarmTrade xizmatlarida hisob, aloqa, mahsulot va buyurtmaga oid ma’lumotlar ishlatiladi. Ochiq e’lon yoki izohlarga maxfiy ma’lumotlarni joylamang.</p></section>
            <section><h2 className="mb-2 text-xl font-semibold">Xavfsiz aloqa</h2><p>Parol, tasdiqlash kodi va karta xavfsizlik kodini hech kimga yubormang.</p></section>
            <section><h2 className="mb-2 text-xl font-semibold">Ma’lumotlaringiz bo‘yicha murojaat</h2><p>Shaxsiy ma’lumotlaringiz haqida savollaringiz bo‘lsa, <Link to="/support" className="text-primary underline">biz bilan bog‘laning</Link>.</p></section>
          </div>
        )}
      </main>
    </div>
  );
}