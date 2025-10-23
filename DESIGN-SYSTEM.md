# 🎨 SAAB SPORTS - DESIGN SYSTEM

## 🎯 CORES DA MARCA

### Cores Principais
```css
--brand-dark: #400404      /* Vinho escuro / Marrom escuro - Base elegante */
--brand-red: #D0494E       /* Vermelho/Rosa vibrante - Acentos e CTAs */
--brand-cream: #E8E2DD     /* Bege/Creme claro - Backgrounds e textos */
```

### Paleta Expandida (Derivada)

#### Dark (Base)
```
50:  #fef2f2  (muito claro)
100: #fee2e2
200: #fecaca
300: #fca5a5
400: #f87171
500: #D0494E  (brand-red)
600: #dc2626
700: #b91c1c
800: #991b1b
900: #400404  (brand-dark)
950: #1a0000  (mais escuro ainda)
```

#### Cream/Neutral
```
50:  #fafaf9
100: #f5f5f4
200: #E8E2DD  (brand-cream)
300: #d6d3d1
400: #a8a29e
500: #78716c
600: #57534e
700: #44403c
800: #292524
900: #1c1917
```

---

## 🎨 APLICAÇÃO DAS CORES

### Background
- **Body**: Gradiente escuro (#400404 → #1a0000)
- **Container Principal**: Branco (#ffffff) ou Cream (#E8E2DD)
- **Sections**: Alternância entre branco e cream suave

### Tipografia
- **Títulos principais**: #400404 (brand-dark)
- **Subtítulos**: #57534e (neutral-600)
- **Texto corpo**: #44403c (neutral-700)
- **Texto em fundos escuros**: #E8E2DD (brand-cream)

### Interações
- **Buttons Primary**: Gradiente #D0494E → #b91c1c
- **Buttons Hover**: Escurecer 10%, scale(1.02)
- **Inputs Focus**: Border #D0494E, Ring #D0494E/20%
- **Links**: #D0494E com hover #400404

### Estados
- **Success**: #22c55e (verde)
- **Error**: #ef4444 (vermelho)
- **Warning**: #f59e0b (laranja)
- **Info**: #3b82f6 (azul)

---

## ✨ MELHORIAS DE UI/UX

### 1. Typography Scale
```
text-xs:    12px / 16px
text-sm:    14px / 20px
text-base:  16px / 24px
text-lg:    18px / 28px
text-xl:    20px / 28px
text-2xl:   24px / 32px
text-3xl:   30px / 36px
text-4xl:   36px / 40px
text-5xl:   48px / 1
```

### 2. Spacing System
```
Sections:     space-y-10 (40px)
Form groups:  space-y-6 (24px)
Elements:     space-y-4 (16px)
Tight:        space-y-2 (8px)

Padding:
- Container:  p-16 (64px)
- Sections:   p-8 (32px)
- Cards:      p-6 (24px)
- Inputs:     p-4 (16px)
```

### 3. Border Radius
```
sm:   4px   (pequenos elementos)
md:   8px   (inputs, cards)
lg:   12px  (seções)
xl:   16px  (containers)
2xl:  24px  (container principal)
3xl:  32px  (hero elements)
```

### 4. Shadows
```
sm:   0 1px 2px rgba(0,0,0,0.05)
md:   0 4px 6px rgba(64,4,4,0.1)
lg:   0 10px 15px rgba(64,4,4,0.15)
xl:   0 20px 25px rgba(64,4,4,0.2)
2xl:  0 25px 50px rgba(64,4,4,0.25)
```

### 5. Animações
```
Transitions:  300ms ease-out
Hover scale:  1.02
Active scale: 0.98
Loading spin: 800ms linear infinite
```

---

## 🎯 COMPONENTES

### Header
- Background: Gradiente #400404 → #1a0000
- Texto: #E8E2DD
- Padding: p-16
- Border radius bottom: rounded-b-3xl (opcional)

### Upload Zone
- Border: 3px dashed #D0494E/40%
- Hover: Border solid + background #fef2f2
- Active: Border #D0494E, background #fee2e2
- Icon size: 64px

### Radio Cards (Templates)
- Border: 2px solid #e5e7eb
- Checked: Border 3px #D0494E, background gradiente #D0494E
- Hover: Border #D0494E/50%, shadow-lg
- Padding: p-10

### Inputs
- Border: 2px #e5e7eb
- Focus: Border #D0494E, ring-4 #D0494E/10%
- Placeholder: #a8a29e
- Padding: px-6 py-4

### Buttons
- Primary: bg-gradient-to-r from-[#D0494E] to-[#b91c1c]
- Hover: shadow-2xl, scale-105
- Active: scale-95
- Disabled: opacity-50, cursor-not-allowed
- Padding: px-8 py-5
- Font: font-bold uppercase tracking-wide

### Status Messages
- Success: bg-green-50, text-green-800, border-green-300
- Error: bg-red-50, text-red-800, border-red-300
- Loading: bg-blue-50, text-blue-800, border-blue-300
- Border: 2px solid
- Padding: p-6
- Border radius: rounded-xl

---

## 🎨 GLASSMORPHISM (Opcional)

Para elementos flutuantes:
```css
background: rgba(232, 226, 221, 0.8);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

---

## 📐 GRID SYSTEM

### Layout Principal
```
max-w-6xl    (1152px) - Container geral
max-w-4xl    (896px)  - Forms
max-w-2xl    (672px)  - Cards pequenos
```

### Columns
```
grid-cols-2  - Radio buttons, preview actions
grid-cols-3  - Cards de features
grid-cols-4  - Métricas pequenas
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Cores
- [x] Definir cores no Tailwind config
- [ ] Aplicar cores de marca em todos os componentes
- [ ] Criar variantes de hover/focus
- [ ] Testar contraste de acessibilidade

### Typography
- [ ] Definir hierarquia de títulos
- [ ] Font weights consistentes
- [ ] Line heights otimizados
- [ ] Letter spacing em headings

### Espaçamento
- [ ] Padding consistente
- [ ] Margins entre seções
- [ ] Gap em grids/flexbox

### Interações
- [ ] Hover states em todos os elementos clicáveis
- [ ] Focus states em inputs
- [ ] Disabled states
- [ ] Loading states
- [ ] Success/Error feedback

### Animações
- [ ] Transitions suaves
- [ ] Micro-interações
- [ ] Skeleton loading (opcional)
- [ ] Progress indicators

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Atualizar Tailwind config
2. ✅ Redesenhar header
3. ✅ Atualizar upload zone
4. ✅ Redesenhar radio cards
5. ✅ Atualizar inputs
6. ✅ Redesenhar botões
7. ✅ Atualizar status messages
8. ✅ Adicionar micro-interações
9. ✅ Testar fluxo completo
10. ✅ Refinar detalhes

---

**Design System v1.0 - SAAB Sports**
