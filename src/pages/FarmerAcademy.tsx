import { useState } from "react";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Play,
  CheckCircle2,
  ChevronLeft,
  Sprout,
  Droplets,
  TrendingUp,
  Bug,
  BarChart3,
  Award,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "image";
  content: string;
  videoUrl?: string;
  imageUrl?: string;
}

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  lessons: Lesson[];
  quiz: Quiz[];
}

const courses: Course[] = [
  {
    id: "modern-farming",
    title: "Zamonaviy dehqonchilik usullari",
    description: "Eng yangi texnologiyalar va usullar bilan hosildorlikni oshiring",
    icon: Sprout,
    color: "bg-primary/10 text-primary",
    lessons: [
      {
        id: "mf-1",
        title: "Zamonaviy dehqonchilik nima?",
        type: "text",
        content:
          "Zamonaviy dehqonchilik — bu ilmiy bilimlar, texnologiyalar va innovatsion usullarni qo'llash orqali ekin yetishtirish samaradorligini oshirish demakdir.\n\n**Asosiy tamoyillar:**\n- Tuproq tahlili asosida o'g'itlash\n- Raqamli monitoring tizimlaridan foydalanish\n- Iqlimshunoslik ma'lumotlariga tayanish\n- Organik va an'anaviy usullarni birlashtirish\n\nZamonaviy fermer tuproq holatini doimo kuzatib boradi, ob-havo ma'lumotlarini tahlil qiladi va ekin parvarishida ilmiy yondashuvni qo'llaydi.",
      },
      {
        id: "mf-2",
        title: "Dronlar va sun'iy intellekt",
        type: "video",
        content:
          "Dronlar yordamida dalalarni monitoring qilish va sun'iy intellekt orqali kasalliklarni aniqlash haqida o'rganing.",
        videoUrl: "https://www.youtube.com/embed/VgRk9ujAHAg",
      },
      {
        id: "mf-3",
        title: "Issiqxona texnologiyalari",
        type: "text",
        content:
          "Issiqxona (teplitsa) texnologiyalari yil davomida ekin yetishtirish imkonini beradi.\n\n**Issiqxona turlari:**\n- Oddiy plyonkali issiqxonalar\n- Polikarbonat issiqxonalar\n- Avtomatlashtirgan zamonaviy issiqxonalar\n\n**Afzalliklari:**\n- Mavsumdan tashqari mahsulot yetishtirish\n- Zararkunandalardan himoya\n- Suv sarfini kamaytirish\n- Hosildorlikni 3-5 barobar oshirish\n\nO'zbekistonda issiqxona xo'jaliklari tobora ko'paymoqda va bu sohada davlat subsidiyalari mavjud.",
      },
    ],
    quiz: [
      {
        question: "Zamonaviy dehqonchilikda tuproq tahlili nima uchun muhim?",
        options: [
          "Faqat davlat talabi uchun",
          "To'g'ri o'g'itlash va ekin tanlash uchun",
          "Yerning rangini bilish uchun",
          "Qo'shnilardan ajralib turish uchun",
        ],
        correctIndex: 1,
      },
      {
        question: "Issiqxonaning asosiy afzalligi nima?",
        options: [
          "Faqat gul yetishtirish mumkin",
          "Mavsumdan tashqari mahsulot yetishtirish",
          "Tuproq kerak emas",
          "O'g'it ishlatish shart emas",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "irrigation",
    title: "Aqlli sug'orish tizimlari",
    description: "Suvni tejash va samarali sug'orish usullarini o'rganing",
    icon: Droplets,
    color: "bg-accent/20 text-accent-foreground",
    lessons: [
      {
        id: "ir-1",
        title: "Tomchilatib sug'orish tizimi",
        type: "text",
        content:
          "Tomchilatib sug'orish — suvni to'g'ridan-to'g'ri o'simlik ildiziga yetkazadigan eng samarali usuldir.\n\n**Afzalliklari:**\n- Suvni 40-60% tejaydi\n- Hosildorlikni 20-30% oshiradi\n- Begona o'tlar kamayadi\n- O'g'itlarni suv bilan birga berish mumkin (fertigatsiya)\n\n**O'rnatish bosqichlari:**\n1. Suv manbai (quduq, hovuz yoki ariq)\n2. Filtr tizimi\n3. Asosiy quvur\n4. Tarqatuvchi quvurlar\n5. Tomizgichlar (drippery)\n\nO'zbekistonda tomchilatib sug'orish tizimini o'rnatish uchun davlat subsidiyasi mavjud.",
      },
      {
        id: "ir-2",
        title: "Sug'orish jadvali",
        type: "text",
        content:
          "Har bir ekin uchun to'g'ri sug'orish jadvali mavjud.\n\n**Pomidor:**\n- O'sish davri: har 2-3 kunda\n- Gullab-meva tugish: har kuni\n- Yetilish: kamroq suv\n\n**Bodring:**\n- Doimiy namlik talab qiladi\n- Har kuni engil sug'orish\n- Ildiz atrofida mulcha qo'yish foydali\n\n**Bug'doy:**\n- Ekish vaqtida bir marta\n- Tuplanish davri: 1-2 marta\n- Boshoqlash davri: 1 marta\n\n**Muhim qoida:** Sug'orishni ertalab yoki kechqurun bajaring. Kunduzi sug'orish suv sarfini oshiradi va barglarni kuydirib qo'yishi mumkin.",
      },
      {
        id: "ir-3",
        title: "Yomg'irlatib sug'orish",
        type: "video",
        content:
          "Yomg'irlatib sug'orish tizimi katta maydonlar uchun qulaydir. Qanday ishlashini ko'ring.",
        videoUrl: "https://www.youtube.com/embed/6fKGbpXqFxs",
      },
    ],
    quiz: [
      {
        question: "Tomchilatib sug'orish qancha suv tejaydi?",
        options: ["10-20%", "20-30%", "40-60%", "80-90%"],
        correctIndex: 2,
      },
      {
        question: "Sug'orishni qachon bajarish yaxshi?",
        options: [
          "Tushda, quyosh tepada turganida",
          "Ertalab yoki kechqurun",
          "Faqat tungi paytda",
          "Farqi yo'q",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "crop-yield",
    title: "Hosildorlikni oshirish usullari",
    description: "Har bir ekindan maksimal hosil olish sirlari",
    icon: TrendingUp,
    color: "bg-yellow-100 text-yellow-700",
    lessons: [
      {
        id: "cy-1",
        title: "Tuproq unumdorligini saqlash",
        type: "text",
        content:
          "Tuproq unumdorligi — hosildorlikning asosi.\n\n**Tuproqni yaxshilash usullari:**\n\n1. **Almashlab ekish (rotatsiya)**\n   - Bir xil ekinni ketma-ket ekmang\n   - Dukkakli ekinlar tuproqni azot bilan boyitadi\n   - 3-4 yillik rotatsiya tavsiya etiladi\n\n2. **Organik o'g'itlar**\n   - Go'ng (chiritilgan)\n   - Kompost\n   - Yashil o'g'it (sideratlar)\n   - Biogumus\n\n3. **Mulchalash**\n   - Tuproq namligini saqlaydi\n   - Begona o'tlarni kamaytiradi\n   - Tuproq haroratini barqarorlaydi\n\n4. **Tuproq tahlili**\n   - Har yili tuproq tahlilini o'tkazing\n   - pH darajasini tekshiring (6.0-7.0 ideal)\n   - Azot, fosfor, kaliy miqdorini bilib oling",
      },
      {
        id: "cy-2",
        title: "Urug'lik tanlash sirri",
        type: "text",
        content:
          "Sifatli urug'lik — yuqori hosil kafolantidir.\n\n**Urug'lik tanlash qoidalari:**\n- Sertifikatlangan urug'lik xarid qiling\n- Mahalliy iqlimga mos navlarni tanlang\n- Urug'likni saqlash shartlariga rioya qiling\n- Ekishdan oldin urug'likni tekshiring\n\n**O'zbekiston uchun eng yaxshi navlar:**\n\n🍅 **Pomidor:** Rio Grand, Bella Rosa, Bobkat\n🥒 **Bodring:** Masha F1, German F1\n🫑 **Qalampir:** Kaliforniya mo'jizasi, Atlas\n🍉 **Tarvuz:** Karastan, AU Produser\n🌾 **Bug'doy:** Turkiston, Elomon\n\nMahalliy seleksiya markazlaridan maslahat olish foydali.",
      },
    ],
    quiz: [
      {
        question: "Almashlab ekish (rotatsiya) nima uchun muhim?",
        options: [
          "Dalaga chiroyli ko'rinish berish uchun",
          "Tuproq unumdorligini saqlash uchun",
          "Qo'shnilar bilan farqlash uchun",
          "Davlat talabi bo'lgani uchun",
        ],
        correctIndex: 1,
      },
      {
        question: "Tuproqning ideal pH darajasi qancha?",
        options: ["2.0-3.0", "4.0-5.0", "6.0-7.0", "9.0-10.0"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "disease",
    title: "O'simlik kasalliklari va oldini olish",
    description: "Kasalliklarni erta aniqlash va davolash usullari",
    icon: Bug,
    color: "bg-red-50 text-red-600",
    lessons: [
      {
        id: "ds-1",
        title: "Eng ko'p tarqalgan kasalliklar",
        type: "text",
        content:
          "O'zbekistonda eng ko'p uchraydigan o'simlik kasalliklari:\n\n🔴 **Fitoftoroz (kech kuydirgi)**\n- Belgilari: barglarda jigarrang dog'lar\n- Sababi: nam va salqin ob-havo\n- Davolash: mis preparatlari (Bordeaux suyuqligi)\n\n🟡 **Un shudring (oidi)**\n- Belgilari: barglarda oq kukun\n- Sababi: quruq va issiq havo\n- Davolash: oltingugurt preparatlari\n\n🟤 **Fuzarioz so'lish**\n- Belgilari: o'simlik pasttdan so'la boshlaydi\n- Sababi: tuproqdagi zamburug'\n- Davolash: chidamli navlar ekish\n\n🟢 **Bakterial dog'lanish**\n- Belgilari: barglarda suvsiz dog'lar\n- Sababi: bakteriyalar\n- Davolash: kasallangan qismlarni olib tashlash\n\n**Muhim:** Kasallikni erta aniqlash 80% hosilni saqlab qoladi!",
      },
      {
        id: "ds-2",
        title: "Zararkunandalar bilan kurash",
        type: "text",
        content:
          "Zararkunandalar bilan kurashning biologik va kimyoviy usullari:\n\n**Biologik usullar (tabiiy):**\n- Foydali hasharotlarni jalb qilish (koksinella, oltin ko'z)\n- O'simlik ekstraktlari (sarimsoq, eman po'stlog'i)\n- Yopishqoq tutqichlar\n- Qushlarni jalb qilish\n\n**Kimyoviy usullar:**\n- Insektitsidlar (hasharotlarga qarshi)\n- Fungitsidlar (zamburug'larga qarshi)\n- Herbitsidlar (begona o'tlarga qarshi)\n\n⚠️ **Ogohlantirish:**\n- Kimyoviy preparatlarni ehtiyotkorlik bilan ishlating\n- Dozani aniq saqlang\n- Himoya vositalarini kiying\n- Hosil yig'ishdan 20-30 kun oldin purkamang\n\n**Eng yaxshi yondashuv:** Integratsiyalashgan himoya — biologik va kimyoviy usullarni birlashtirish.",
      },
    ],
    quiz: [
      {
        question: "Fitoftoroz (kech kuydirgi) belgisi nima?",
        options: [
          "Barglarda oq kukun",
          "Barglarda jigarrang dog'lar",
          "O'simlik tez o'sadi",
          "Meva kattaradi",
        ],
        correctIndex: 1,
      },
      {
        question: "Kimyoviy preparatlarni hosil yig'ishdan necha kun oldin to'xtatish kerak?",
        options: ["1-2 kun", "5-10 kun", "20-30 kun", "60-90 kun"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "market",
    title: "Qishloq xo'jaligi bozor strategiyalari",
    description: "Mahsulotni to'g'ri narxlash va sotish sirlari",
    icon: BarChart3,
    color: "bg-purple-50 text-purple-600",
    lessons: [
      {
        id: "mk-1",
        title: "Mahsulotni narxlash strategiyasi",
        type: "text",
        content:
          "Mahsulotni to'g'ri narxlash — muvaffaqiyat kalitidir.\n\n**Narx belgilash omillari:**\n\n1. **Tannarx hisoblash**\n   - Urug'lik xarajatlari\n   - O'g'it va dori-darmon\n   - Suv va energiya\n   - Ishchi kuchi\n   - Transport\n\n2. **Bozor tahlili**\n   - Raqobatchilar narxini o'rganing\n   - Mavsumiy o'zgarishlarni hisobga oling\n   - Talab va taklif nisbatini kuzating\n\n3. **Foyda rejalashtirish**\n   - Kamida 30-40% foyda qo'shing\n   - Yo'qotishlarni hisobga oling (5-10%)\n\n**Mavsumiy strategiya:**\n- 🌱 Erta mahsulot = yuqori narx\n- 🌿 Mavsumda = o'rtacha narx\n- 🍂 Kech mahsulot = yuqori narx\n- ❄️ Qishda (issiqxona) = eng yuqori narx",
      },
      {
        id: "mk-2",
        title: "Onlayn savdo va marketing",
        type: "text",
        content:
          "Zamonaviy fermer onlayn platformalardan foydalanishi kerak!\n\n**FarmTrade platformasida sotish:**\n1. Profil yarating va fermer sifatida ro'yxatdan o'ting\n2. Mahsulot rasmlarini sifatli oling\n3. Batafsil tavsif yozing\n4. Raqobatbardosh narx belgilang\n5. Xaridorlarga tez javob bering\n\n**Sifatli rasm olish:**\n- Tabiiy yorug'likda suring\n- Toza va chiroyli joylashtiring\n- Yaqindan va uzoqdan suring\n- Hajmini ko'rsatuvchi narsa qo'ying\n\n**Marketing sirlari:**\n- Doimiy mijozlar bazasini yarating\n- Sifatli mahsulot — eng yaxshi reklama\n- Ijtimoiy tarmoqlarda faol bo'ling\n- Mahsulotingiz haqida hikoya aylantiring\n\n**Maslahat:** FarmTrade orqali mijozlar bilan to'g'ridan-to'g'ri muloqot qiling va ishonch o'rnating!",
      },
    ],
    quiz: [
      {
        question: "Mahsulot narxiga kamida necha foiz foyda qo'shish kerak?",
        options: ["5-10%", "10-20%", "30-40%", "80-100%"],
        correctIndex: 2,
      },
      {
        question: "Qachon eng yuqori narxda sotish mumkin?",
        options: [
          "Mavsumning o'rtasida",
          "Erta yoki kech mahsulot chiqarganda",
          "Faqat bozorda",
          "Faqat kechqurun",
        ],
        correctIndex: 1,
      },
    ],
  },
];

const FarmerAcademy = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());

  const handleBack = () => {
    if (showQuiz) {
      setShowQuiz(false);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else {
      setSelectedCourse(null);
      setCurrentLessonIndex(0);
      setShowQuiz(false);
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  const handleNext = () => {
    if (selectedCourse && currentLessonIndex < selectedCourse.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (selectedCourse) {
      const allCorrect = selectedCourse.quiz.every(
        (q, i) => quizAnswers[i] === String(q.correctIndex)
      );
      if (allCorrect) {
        setCompletedCourses((prev) => new Set([...prev, selectedCourse.id]));
      }
    }
  };

  const getQuizScore = () => {
    if (!selectedCourse) return 0;
    return selectedCourse.quiz.filter(
      (q, i) => quizAnswers[i] === String(q.correctIndex)
    ).length;
  };

  // Course list view
  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Bepul ta'lim</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-poppins font-bold text-foreground mb-3">
              Fermer Akademiyasi
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Bilimingizni oshiring, hosildorlikni ko'paytiring. Bepul darslar, amaliy maslahatlar va testlar.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Kurslar", value: courses.length, icon: BookOpen },
              { label: "Darslar", value: courses.reduce((sum, c) => sum + c.lessons.length, 0), icon: FileText },
              { label: "Testlar", value: courses.reduce((sum, c) => sum + c.quiz.length, 0), icon: HelpCircle },
              { label: "Tugallangan", value: completedCourses.size, icon: Award },
            ].map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Course grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const Icon = course.icon;
              const isCompleted = completedCourses.has(course.id);
              return (
                <Card
                  key={course.id}
                  className="hover:shadow-medium transition-all duration-300 cursor-pointer group border-border hover:border-primary/30"
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${course.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {isCompleted && (
                        <Badge className="bg-primary/10 text-primary border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Tugatildi
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" /> {course.lessons.length} dars
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-4 h-4" /> {course.quiz.length} test
                      </span>
                    </div>
                    <Button variant="ghost" className="w-full mt-4 group-hover:bg-primary/5">
                      Boshlash <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Course detail view
  const currentLesson = selectedCourse.lessons[currentLessonIndex];
  const progressPercent = showQuiz
    ? 100
    : ((currentLessonIndex + 1) / (selectedCourse.lessons.length + 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Orqaga
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{selectedCourse.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {showQuiz
                  ? "Test"
                  : `${currentLessonIndex + 1}/${selectedCourse.lessons.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* Quiz view */}
        {showQuiz ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <CardTitle>Bilimingizni tekshiring</CardTitle>
              </div>
              <CardDescription>
                Barcha savollarga javob bering va natijangizni bilib oling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {selectedCourse.quiz.map((q, qIndex) => (
                <div key={qIndex} className="space-y-3">
                  <p className="font-medium text-foreground">
                    {qIndex + 1}. {q.question}
                  </p>
                  <RadioGroup
                    value={quizAnswers[qIndex] || ""}
                    onValueChange={(val) =>
                      setQuizAnswers((prev) => ({ ...prev, [qIndex]: val }))
                    }
                    disabled={quizSubmitted}
                  >
                    {q.options.map((opt, oIndex) => {
                      const isCorrect = oIndex === q.correctIndex;
                      const isSelected = quizAnswers[qIndex] === String(oIndex);
                      let optClass = "";
                      if (quizSubmitted) {
                        if (isCorrect) optClass = "bg-primary/10 border-primary/30 rounded-lg p-2";
                        else if (isSelected && !isCorrect)
                          optClass = "bg-destructive/10 border-destructive/30 rounded-lg p-2";
                        else optClass = "p-2";
                      } else {
                        optClass = "p-2";
                      }
                      return (
                        <div key={oIndex} className={optClass}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={String(oIndex)} id={`q${qIndex}-o${oIndex}`} />
                            <Label htmlFor={`q${qIndex}-o${oIndex}`} className="cursor-pointer">
                              {opt}
                            </Label>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}

              {!quizSubmitted ? (
                <Button
                  className="w-full"
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < selectedCourse.quiz.length}
                >
                  Javoblarni tekshirish
                </Button>
              ) : (
                <div className="text-center space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-center gap-2">
                    <Award className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-bold text-foreground">
                      {getQuizScore()}/{selectedCourse.quiz.length}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {getQuizScore() === selectedCourse.quiz.length
                      ? "🎉 Ajoyib! Barcha javoblar to'g'ri!"
                      : `Siz ${getQuizScore()} ta to'g'ri javob berdingiz. Darslarni qayta ko'rib chiqing.`}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowQuiz(false);
                        setCurrentLessonIndex(0);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                    >
                      Darslarni qayta ko'rish
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedCourse(null);
                        setCurrentLessonIndex(0);
                        setShowQuiz(false);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                    >
                      Boshqa kurslar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Lesson view */
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {currentLesson.type === "video" && <Play className="w-4 h-4" />}
                {currentLesson.type === "text" && <FileText className="w-4 h-4" />}
                {currentLesson.type === "image" && <ImageIcon className="w-4 h-4" />}
                <span>
                  {currentLesson.type === "video"
                    ? "Video dars"
                    : currentLesson.type === "image"
                    ? "Rasm / Diagramma"
                    : "Matn darsi"}
                </span>
              </div>
              <CardTitle>{currentLesson.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video embed */}
              {currentLesson.type === "video" && currentLesson.videoUrl && (
                <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                  <iframe
                    src={currentLesson.videoUrl}
                    title={currentLesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Image */}
              {currentLesson.type === "image" && currentLesson.imageUrl && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={currentLesson.imageUrl}
                    alt={currentLesson.title}
                    className="w-full"
                  />
                </div>
              )}

              {/* Text content */}
              <div className="prose prose-green max-w-none">
                {currentLesson.content.split("\n\n").map((paragraph, i) => (
                  <div key={i} className="mb-4">
                    {paragraph.split("\n").map((line, j) => {
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return (
                          <h3 key={j} className="font-semibold text-foreground mt-4 mb-2">
                            {line.replace(/\*\*/g, "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("- ") || line.startsWith("  - ")) {
                        const indent = line.startsWith("  ") ? "ml-4" : "";
                        return (
                          <div key={j} className={`flex items-start gap-2 text-foreground/80 py-0.5 ${indent}`}>
                            <span className="text-primary mt-1.5 text-xs">●</span>
                            <span>{line.replace(/^[\s-]+/, "").replace(/\*\*/g, "")}</span>
                          </div>
                        );
                      }
                      if (/^\d+\./.test(line)) {
                        return (
                          <div key={j} className="flex items-start gap-2 text-foreground/80 py-0.5">
                            <span className="text-primary font-semibold min-w-[24px]">
                              {line.match(/^\d+/)?.[0]}.
                            </span>
                            <span>{line.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "")}</span>
                          </div>
                        );
                      }
                      if (line.startsWith("⚠️") || line.startsWith("🔴") || line.startsWith("🟡") || line.startsWith("🟤") || line.startsWith("🟢") || line.startsWith("🍅") || line.startsWith("🥒") || line.startsWith("🫑") || line.startsWith("🍉") || line.startsWith("🌾") || line.startsWith("🌱") || line.startsWith("🌿") || line.startsWith("🍂") || line.startsWith("❄️")) {
                        return (
                          <p key={j} className="text-foreground/80 py-1">
                            {line.replace(/\*\*/g, "")}
                          </p>
                        );
                      }
                      return (
                        <p key={j} className="text-foreground/80 leading-relaxed">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() =>
                    currentLessonIndex > 0
                      ? setCurrentLessonIndex(currentLessonIndex - 1)
                      : handleBack()
                  }
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {currentLessonIndex > 0 ? "Oldingi dars" : "Kurslar"}
                </Button>
                <Button onClick={handleNext}>
                  {currentLessonIndex < selectedCourse.lessons.length - 1
                    ? "Keyingi dars"
                    : "Testga o'tish"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FarmerAcademy;
