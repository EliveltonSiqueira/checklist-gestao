# Checklist Gestão — app Android e iOS (Super Vilton)

App instalável do checklist de abertura e fechamento de loja. É o mesmo HTML do checklist, empacotado com **Capacitor**: ícone na tela inicial, sem navegador, funciona 100% offline.

- `appId`: `br.com.supervilton.checklist` · nome: **Checklist Gestão**
- Web: Vite + JavaScript puro. PDF com jsPDF + jspdf-autotable.
- Plugins: Camera, Filesystem, Share, Preferences, StatusBar, SplashScreen.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/config.js` | **`EMPRESA`, `LOJAS` e `CHECKLISTS`.** Edite aqui para mudar itens, grupos ou lojas. |
| `src/app.js` | Tela, respostas, validação, diálogos e rascunho |
| `src/pdf.js` | Layout do PDF (A4) |
| `src/native.js` | Câmera, galeria, arquivos, compartilhar e rascunho nativo |
| `src/styles.css` | Visual (paleta no `:root`) |
| `android/`, `ios/` | Projetos nativos gerados pelo Capacitor |
| `assets/` | Imagens-base do ícone e da splash (`npm run assets`) |
| `keystore/` + `android/keystore.properties` | **Chave de assinatura do Android — veja o aviso abaixo** |
| `releases/` | APK e AAB prontos |

## Pré-requisitos (Windows)

- Node 22 ou superior
- **JDK 21** (o Capacitor 8 exige; o JDK 17 do Android Studio não serve). Aqui: `C:\Program Files\Java\jdk-21`
- Android SDK (vem com o Android Studio)

## Comandos

```bash
npm install
npm run dev            # abre no navegador, para ajustar a tela
npm run build:all      # build web + npx cap sync (Android e iOS)
npm run android:release  # APK + AAB assinados em releases/
npm run assets         # regenera ícones e splash a partir de assets/
npx cap open android   # abre no Android Studio
npx cap open ios       # abre no Xcode (só em Mac)
```

Depois de mudar qualquer coisa em `src/`, rode `npm run build:all` antes de gerar o app de novo.

## Android

### Instalar direto no celular (APK)

1. Rode `npm run android:release`.
2. Envie `releases/checklist-gestao.apk` para o celular (WhatsApp, e-mail, cabo ou Drive).
3. Abra o arquivo e permita "instalar apps de fontes desconhecidas" quando o Android pedir.

O `releases/checklist-gestao.aab` serve para uma eventual publicação na Play Store.

### ⚠️ Guarde a keystore

- Arquivo: `keystore/checklist-release.jks`. Alias: `checklist`.
- A senha está em `android/keystore.properties`.
- **Sem esse arquivo e essa senha não é possível atualizar o app** (nem por APK, nem na Play Store): o Android recusa uma atualização assinada com outra chave.
- Faça uma cópia dos dois num lugar seguro (pen drive, cofre de senhas). Não publique em repositório. O `.gitignore` já os exclui.

### Android sem Android Studio: GitHub Actions

O workflow `.github/workflows/android.yml` gera APK e AAB a cada push e deixa em *Actions → run → Artifacts*. Para sair assinado, cadastre em *Settings → Secrets and variables → Actions*:

| Segredo | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 keystore/checklist-release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | senha (campo `storePassword` do `keystore.properties`) |
| `ANDROID_KEY_ALIAS` | `checklist` |
| `ANDROID_KEY_PASSWORD` | senha da chave (`keyPassword`) |

## iPhone sem conta Apple: app web instalável (PWA)

Um `.ipa` não se instala por WhatsApp. A alternativa gratuita é publicar o app web e instalá-lo pelo Safari:

1. Suba o projeto para um repositório no GitHub e ative *Settings → Pages → Source: GitHub Actions*. O workflow `.github/workflows/pages.yml` publica o app em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. (Qualquer hospedagem HTTPS serve: Netlify, Cloudflare Pages etc. Basta publicar a pasta `dist/`.)
2. Mande esse link por WhatsApp.
3. No iPhone, abra o link **no Safari** → botão Compartilhar → **Adicionar à Tela de Início**.

Depois da primeira abertura (com internet) o app funciona offline. Rascunho e fotos ficam no armazenamento do Safari. Limitações: o iOS pode apagar os dados de sites web sem uso por semanas, e não há câmera nativa (usa o seletor do iOS: tirar foto ou biblioteca). O PDF abre na folha de compartilhar do iPhone.

## iOS nativo (App Store / TestFlight)

O projeto Xcode está pronto em `ios/App/App.xcodeproj`. Compilar para iPhone exige um Mac (ou o runner macOS do GitHub) e uma **conta Apple Developer** para instalar em aparelho real.

Opções de instalação:

- **(a) Xcode com o iPhone no cabo, para testes.** Abra o projeto, escolha seu time em *Signing & Capabilities* e rode no aparelho. Com conta gratuita o app expira em 7 dias.
- **(b) TestFlight.** Exige conta Apple Developer (US$ 99/ano). Envie o build pelo Xcode (*Product → Archive → Distribute*) e convide os encarregados por e-mail. Bom para uso interno.
- **(c) App Store.** Mesmo caminho do TestFlight, mais a ficha da loja, capturas de tela e revisão da Apple.

### iOS sem Mac: GitHub Actions

O workflow `.github/workflows/ios.yml` roda em `macos-15`.

- **Sem segredos:** só confirma que o projeto compila (simulador).
- **Com segredos:** gera o `.ipa` assinado como artifact.

Segredos necessários (*Settings → Secrets and variables → Actions*):

| Segredo | Valor |
|---|---|
| `IOS_CERT_P12_BASE64` | certificado *Apple Distribution* exportado em `.p12`, em base64 |
| `IOS_CERT_PASSWORD` | senha usada ao exportar o `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | perfil de provisionamento *App Store* do `br.com.supervilton.checklist`, em base64 |
| `IOS_PROVISIONING_PROFILE_NAME` | nome do perfil, como aparece no portal Apple |
| `IOS_TEAM_ID` | Team ID da conta Apple Developer |

Antes, no portal developer.apple.com: crie o App ID `br.com.supervilton.checklist`, o certificado de distribuição e o perfil.

## Comportamento no app

- **Rascunho automático:** respostas, observações e fotos são salvas a cada alteração (arquivo no armazenamento do app) e voltam ao reabrir. O último nome usado é lembrado.
- **PDF:** gerado no aparelho, sem internet. Salvo em cache e aberto no menu de compartilhar nativo (WhatsApp, e-mail, Salvar em Arquivos). Nome: `checklist-{abertura|fechamento}-{loja01|loja02}-{AAAA-MM-DD}.pdf`.
- **Fotos:** "Tirar foto" ou "Escolher da galeria", comprimidas para no máximo 1100 px, JPEG 0,72.
- Orientação só retrato; zoom por pinça desativado; fundo da WebView `#F3EDE4`.

## Status dos testes

Veja o resumo entregue junto com o projeto. Em resumo: o build Android foi gerado e a assinatura do APK foi verificada; a interface e o PDF foram testados no navegador; **não foi possível testar no emulador Android nem no iOS** (a máquina não tem aceleração de hardware nem Xcode). Teste em um celular real antes de distribuir.
