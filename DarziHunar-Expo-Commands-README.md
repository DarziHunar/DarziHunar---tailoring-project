# DarziHunar Mobile — Expo & EAS Commands

A quick reference for running the app locally, creating Android builds, and publishing over-the-air (OTA) updates with EAS Update.

> Run all commands from the `mobile/` directory unless stated otherwise.

## 1. Open the mobile project

```bash
cd ~/Documents/personal_projects/DarziHunar---tailoring-project/mobile
```

## 2. Run the app during development

Start the installed **Development APK** and connect it to your local Metro server:

```bash
npx expo start --dev-client
```

For a device on a different network, you can try Expo's tunnel:

```bash
npx expo start --dev-client --tunnel
```

Keep your Mac and Metro server running while using this workflow. JavaScript/TypeScript changes can appear through Fast Refresh. Native configuration or native dependency changes require a new development build.

## 3. Build a Development APK

Use this when you need a new development client, for example after adding or changing native dependencies, app scheme, Android permissions, or other native configuration:

```bash
eas build --profile development --platform android
```

Install the resulting build on your own Android device. To see its build history:

```bash
eas build:list
```

## 4. Build the Preview APK for friends/testers

Create a Preview APK when sharing the app for independent testing:

```bash
eas build --profile preview --platform android
```

After the build finishes, open its build page in the Expo dashboard and share the Android installation link with your friends. They install this APK once.

**Important:** The Preview build profile in `eas.json` must use the `preview` update channel. For example:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    }
  }
}
```

Keep any other existing settings in your `eas.json`; do not replace the whole file just to add this example.

## 5. Publish code/UI changes to friends (EAS Update)

After making and testing JavaScript/TypeScript or compatible asset changes, publish an update to the Preview channel:

```bash
eas update --channel preview --message "Describe the change"
```

When the CLI asks for an environment, select **`preview`** if that is the environment configured for your Preview builds.

Examples:

```bash
eas update --channel preview --message "Updated home screen"
eas update --channel preview --message "Added tailor profile page"
eas update --channel preview --message "Fixed login validation"
```

Friends do **not** need a new APK for compatible OTA updates. Their installed Preview APK needs internet access and will check for updates according to the app's `expo-updates` settings. The update may be applied on a subsequent app reload/restart; it is not a live preview while you are typing.

## 6. When is a new APK required?

Create and distribute a new Preview APK when a change affects the native app binary, such as:

- Adding, removing, or changing a native dependency/plugin.
- Changing Android permissions or other native Android configuration.
- Changing the app scheme or native configuration.
- Changing the runtime version incompatibly.

For ordinary React Native screens, styling, JavaScript/TypeScript logic, and compatible bundled assets, publish an EAS Update instead.

## 7. Useful checks

```bash
# Show EAS builds
eas build:list

# Show configured EAS channels
eas channel:list

# Run Expo diagnostics
npx expo-doctor

# Check whether installed packages match the Expo SDK
npx expo install --check
```

## 8. One-time EAS Update setup (already run for this project)

These commands were used to configure the project. Do not rerun them routinely:

```bash
npx expo install expo-updates
eas update:configure
```

The project was configured with an EAS update URL and `runtimeVersion` policy `appVersion`. Keep the runtime version consistent between the installed Preview APK and the updates you publish. If you change the app version/runtime policy, build and distribute a compatible new binary as needed.

## Quick reminder

| Goal | Command |
|---|---|
| Start local development | `npx expo start --dev-client` |
| Start development over tunnel | `npx expo start --dev-client --tunnel` |
| Build Development APK | `eas build --profile development --platform android` |
| Build/share Preview APK | `eas build --profile preview --platform android` |
| Publish update for friends | `eas update --channel preview --message "Your message"` |
| List builds | `eas build:list` |

**Recommended workflow:** You use the Development APK while coding. Friends install the Preview APK once. After compatible code changes are ready for them, publish with `eas update --channel preview --message "..."`. Keep secrets out of the mobile app and never commit `.env` files containing credentials.
