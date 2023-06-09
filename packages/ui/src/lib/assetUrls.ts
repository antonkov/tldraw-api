import { defaultEditorAssetUrls, EditorAssetUrls, EMBED_DEFINITIONS } from '@tldraw/editor'
import { LANGUAGES } from './hooks/useTranslation/languages'
import { TLUiIconType, TLUiIconTypes } from './icon-types'

export type UiAssetUrls = EditorAssetUrls & {
	icons: Record<TLUiIconType, string>
	translations: Record<(typeof LANGUAGES)[number]['locale'], string>
	embedIcons: Record<(typeof EMBED_DEFINITIONS)[number]['type'], string>
}

export let defaultUiAssetUrls: UiAssetUrls = {
	...defaultEditorAssetUrls,
	icons: Object.fromEntries(
		TLUiIconTypes.map((name) => [name, `/icons/icon/${name}.svg`])
	) as Record<TLUiIconType, string>,
	translations: Object.fromEntries(
		LANGUAGES.map((lang) => [lang.locale, `/translations/${lang.locale}.json`])
	) as Record<(typeof LANGUAGES)[number]['locale'], string>,
	embedIcons: Object.fromEntries(
		EMBED_DEFINITIONS.map((def) => [def.type, `/embed-icons/${def.type}.png`])
	) as Record<(typeof EMBED_DEFINITIONS)[number]['type'], string>,
}

/** @internal */
export function setDefaultUiAssetUrls(urls: UiAssetUrls) {
	defaultUiAssetUrls = urls
}
