import React, { useCallback, useMemo, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import chalk from 'chalk';
import {
  ADULT_MENU_ID,
  GENERIC_ID,
  OTHERS_ID,
  getAdultPlatformList,
  getMainPlatformList,
  getOthersSubmenuList,
} from './platforms/catalog.js';
import { detectPlatform, isAdultPlatform, isValidHttpUrl } from './platforms/detect.js';
import { AutocompleteSelect } from './ui/AutocompleteSelect.js';
import { ProgressBar } from './ui/ProgressBar.js';
import { downloadVideo, probeVideo, DEFAULT_PROBE_TIMEOUT_MS } from './download/downloader.js';
import {
  DRIP_INTERVAL_MS,
  nextDripPercent,
  progressBarWidth,
  resolveDisplayProgress,
} from './download/displayProgress.js';
import { buildFilenameBase } from './download/filename.js';
import { getDefaultDownloadDir } from './config/paths.js';
import { t } from './i18n/index.js';
import type { FormatOption, Platform, SelectItem, WizardStep } from './types.js';

export interface AppProps {
  initialUrl?: string;
  initialDir?: string;
}

export function App({ initialUrl = '', initialDir }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [step, setStep] = useState<WizardStep>('url');
  const [url, setUrl] = useState(initialUrl);
  const [urlDraft, setUrlDraft] = useState(initialUrl);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [adultAccepted, setAdultAccepted] = useState(false);
  const [formats, setFormats] = useState<FormatOption[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);
  const [title, setTitle] = useState('');
  const [filenameBase, setFilenameBase] = useState('');
  const [dirDraft, setDirDraft] = useState(initialDir ?? getDefaultDownloadDir());
  const [savedPath, setSavedPath] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [dripProgress, setDripProgress] = useState(0);
  const [realProgress, setRealProgress] = useState(0);
  const [hasRealProgress, setHasRealProgress] = useState(false);
  const [probeSeconds, setProbeSeconds] = useState(0);
  const [againDraft, setAgainDraft] = useState('');
  const bootstrapped = React.useRef(false);

  const displayProgress = resolveDisplayProgress(dripProgress, realProgress);

  const mainItems: SelectItem[] = useMemo(() => {
    const items = getMainPlatformList().map((p) => ({
      value: p.id,
      label: p.id === OTHERS_ID ? t('othersLabel') : p.label,
    }));
    return items.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, []);

  const othersItems: SelectItem[] = useMemo(() => {
    const items = getOthersSubmenuList().map((p) => ({
      value: p.id,
      label:
        p.id === ADULT_MENU_ID
          ? t('adultMenuLabel')
          : p.id === GENERIC_ID
            ? t('genericLabel')
            : p.label,
    }));
    return items.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, []);

  const adultItems: SelectItem[] = useMemo(() => {
    const items = getAdultPlatformList().map((p) => ({ value: p.id, label: p.label }));
    return items.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, []);

  const resetToStart = useCallback(() => {
    setStep('url');
    setUrl('');
    setUrlDraft('');
    setPlatform(null);
    setAdultAccepted(false);
    setFormats([]);
    setSelectedFormat(null);
    setTitle('');
    setFilenameBase('');
    setSavedPath('');
    setError('');
    setStatus('');
    setDripProgress(0);
    setRealProgress(0);
    setHasRealProgress(false);
    setProbeSeconds(0);
  }, []);

  // Option A: drip one bar column every 500ms until yt-dlp reports real %.
  React.useEffect(() => {
    if (step !== 'downloading' || hasRealProgress) return;
    const width = progressBarWidth(process.stdout.columns);
    const id = setInterval(() => {
      setDripProgress((current) => nextDripPercent(current, width));
    }, DRIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [step, hasRealProgress]);

  const startProbe = useCallback(
    async (targetUrl: string, selected: Platform | null) => {
      setStep('probing');
      setStatus(t('probing'));
      setProbeSeconds(0);
      setError('');

      const startedAt = Date.now();
      const tick = setInterval(() => {
        setProbeSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 500);

      try {
        const timeoutSec = Math.round(DEFAULT_PROBE_TIMEOUT_MS / 1000);
        const probe = await probeVideo(targetUrl, {
          sizeUnavailableLabel: t('sizeUnavailable'),
          timeoutMs: DEFAULT_PROBE_TIMEOUT_MS,
          timeoutMessage: t('probeTimeout', { seconds: String(timeoutSec) }),
          noFormatsMessage: t('noFormats'),
        });
        setTitle(probe.title);
        setFilenameBase(buildFilenameBase(probe.title));
        setFormats(probe.formats);
        setPlatform(selected);
        setStep('format');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStep('error');
      } finally {
        clearInterval(tick);
      }
    },
    [],
  );

  const continueAfterPlatform = useCallback(
    (selected: Platform, targetUrl: string) => {
      if (isAdultPlatform(selected) && !adultAccepted) {
        setPlatform(selected);
        setStep('ageGate');
        return;
      }
      void startProbe(targetUrl, selected);
    },
    [adultAccepted, startProbe],
  );

  const handleUrlSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!isValidHttpUrl(trimmed)) {
        setError(t('invalidUrl'));
        return;
      }
      setError('');
      setUrl(trimmed);
      const detected = detectPlatform(trimmed);
      if (!detected) {
        setStep('platform');
        return;
      }
      if (isAdultPlatform(detected) && !adultAccepted) {
        setPlatform(detected);
        setStep('ageGate');
        return;
      }
      void startProbe(trimmed, detected);
    },
    [adultAccepted, startProbe],
  );

  React.useEffect(() => {
    if (bootstrapped.current || !initialUrl) return;
    bootstrapped.current = true;
    handleUrlSubmit(initialUrl);
  }, [initialUrl, handleUrlSubmit]);

  const handleMainPlatform = (item: SelectItem) => {
    if (item.value === OTHERS_ID) {
      setStep('others');
      return;
    }
    const list = getMainPlatformList();
    const selected = list.find((p) => p.id === item.value);
    if (selected) continueAfterPlatform(selected, url);
  };

  const handleOthers = (item: SelectItem) => {
    if (item.value === ADULT_MENU_ID) {
      setStep('adult');
      return;
    }
    if (item.value === GENERIC_ID) {
      void startProbe(url, {
        id: GENERIC_ID,
        label: t('genericLabel'),
        category: 'special',
        match: [],
      });
    }
  };

  const handleAdultPlatform = (item: SelectItem) => {
    const selected = getAdultPlatformList().find((p) => p.id === item.value);
    if (selected) continueAfterPlatform(selected, url);
  };

  const handleAgeGate = (item: SelectItem) => {
    if (item.value === 'decline') {
      resetToStart();
      return;
    }
    setAdultAccepted(true);
    const selected = platform;
    if (selected) {
      void startProbe(url, selected);
    } else {
      setStep('platform');
    }
  };

  const handleFormat = (item: SelectItem) => {
    const format = formats.find((f) => f.id === item.value) ?? null;
    setSelectedFormat(format);
    setStep('directory');
  };

  const handleDirSubmit = async (value: string) => {
    const dir = value.trim() || getDefaultDownloadDir();
    if (!selectedFormat) return;
    setStep('downloading');
    setStatus(t('downloading'));
    setDripProgress(0);
    setRealProgress(0);
    setHasRealProgress(false);
    try {
      const result = await downloadVideo(
        {
          url,
          formatId: selectedFormat.formatId,
          outputDir: dir,
          filenameBase,
          platformId: platform?.id,
        },
        {
          onProgress: (percent) => {
            setHasRealProgress(true);
            setRealProgress(percent);
          },
        },
      );
      setHasRealProgress(true);
      setRealProgress(100);
      setDripProgress(100);
      setStatus(t('stripping'));
      setSavedPath(result.filePath);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  };

  const ageGateItems: SelectItem[] = [
    { value: 'accept', label: t('ageGateAccept') },
    { value: 'decline', label: t('ageGateDecline') },
  ];

  const formatItems: SelectItem[] = formats.map((f) => ({ value: f.id, label: f.label }));

  return (
    <Box flexDirection="column" padding={1}>
      {step === 'url' && (
        <Box flexDirection="column">
          <Text>{chalk.cyan(t('promptUrl'))}</Text>
          <Box>
            <Text>{chalk.gray('> ')}</Text>
            <TextInput
              value={urlDraft}
              onChange={setUrlDraft}
              onSubmit={handleUrlSubmit}
            />
          </Box>
          {error ? <Text color="red">{error}</Text> : null}
        </Box>
      )}

      {step === 'platform' && (
        <AutocompleteSelect
          title={t('selectPlatform')}
          items={mainItems}
          onSelect={handleMainPlatform}
          onCancel={resetToStart}
        />
      )}

      {step === 'others' && (
        <AutocompleteSelect
          title={t('selectOthers')}
          items={othersItems}
          onSelect={handleOthers}
          onCancel={() => setStep('platform')}
        />
      )}

      {step === 'adult' && (
        <AutocompleteSelect
          title={t('selectAdult')}
          items={adultItems}
          onSelect={handleAdultPlatform}
          onCancel={() => setStep('others')}
        />
      )}

      {step === 'ageGate' && (
        <Box flexDirection="column">
          <Text color="yellow" bold>
            {t('ageGateTitle')}
          </Text>
          <Text>{t('ageGateBody')}</Text>
          <Box marginTop={1}>
            <AutocompleteSelect
              title=""
              items={ageGateItems}
              onSelect={handleAgeGate}
              onCancel={resetToStart}
            />
          </Box>
        </Box>
      )}

      {step === 'probing' && (
        <Box flexDirection="column">
          <Text color="cyan">
            {t('probingElapsed', { seconds: String(probeSeconds) })}
          </Text>
        </Box>
      )}

      {step === 'downloading' && (
        <Box flexDirection="column">
          <Text color="cyan">{status || t('downloading')}</Text>
          <Box marginTop={1}>
            <ProgressBar percent={displayProgress} />
          </Box>
        </Box>
      )}

      {step === 'format' && (
        <Box flexDirection="column">
          <Text dimColor>{title}</Text>
          <AutocompleteSelect
            title={t('selectFormat')}
            items={formatItems}
            onSelect={handleFormat}
            onCancel={resetToStart}
          />
        </Box>
      )}

      {step === 'directory' && (
        <Box flexDirection="column">
          <Text>{chalk.cyan(t('promptDir'))}</Text>
          <Text dimColor>{t('dirHint')}</Text>
          <Box>
            <Text>{chalk.gray('> ')}</Text>
            <TextInput value={dirDraft} onChange={setDirDraft} onSubmit={(v) => void handleDirSubmit(v)} />
          </Box>
        </Box>
      )}

      {step === 'done' && (
        <Box flexDirection="column">
          <Text color="green" bold>
            {t('done')}
          </Text>
          <Text>
            {t('savedAt')} {chalk.white(savedPath)}
          </Text>
          <Box marginTop={1}>
            <Text>{t('again')} </Text>
            <TextInput
              value={againDraft}
              onChange={setAgainDraft}
              onSubmit={(v) => {
                const answer = v.trim().toLowerCase();
                if (answer === 's' || answer === 'y' || answer === 'sim' || answer === 'yes') {
                  setAgainDraft('');
                  resetToStart();
                } else {
                  exit();
                }
              }}
            />
          </Box>
        </Box>
      )}

      {step === 'error' && (
        <Box flexDirection="column">
          <Text color="red" bold>
            {t('error')}
          </Text>
          {error.split('\n').map((line, idx) => (
            <Text key={`${idx}-${line.slice(0, 24)}`} color="red">
              {line}
            </Text>
          ))}
          <Box marginTop={1}>
            <AutocompleteSelect
              title={t('retryPrompt')}
              items={[
                { value: 'retry', label: t('yes') },
                { value: 'quit', label: t('no') },
              ]}
              onSelect={(item) => {
                if (item.value === 'retry') resetToStart();
                else exit();
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
