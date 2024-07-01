import type { Meta, StoryObj } from '@storybook/react'

import { Transcript } from './Transcript'
import { FIXTURE_TRANSCRIPT, FIXTURE_USER_ACCOUNT_INFO, transcriptFixture } from './fixtures'

import {
    type ChatMessage,
    PromptString,
    RateLimitError,
    errorToChatError,
    ps,
} from '@sourcegraph/cody-shared'
import { useArgs, useCallback, useEffect, useRef, useState } from '@storybook/preview-api'
import type { ComponentProps } from 'react'
import { URI } from 'vscode-uri'
import { VSCodeWebview } from '../storybook/VSCodeStoryDecorator'

const meta: Meta<typeof Transcript> = {
    title: 'ui/Transcript',
    component: Transcript,

    argTypes: {
        transcript: {
            name: 'Transcript fixture',
            options: Object.keys(FIXTURE_TRANSCRIPT),
            mapping: FIXTURE_TRANSCRIPT,
            control: { type: 'select' },
        },
    },
    args: {
        chatID: 'test',
        transcript: FIXTURE_TRANSCRIPT.simple,
        messageInProgress: null,
        feedbackButtonsOnSubmit: () => {},
        copyButtonOnSubmit: () => {},
        insertButtonOnSubmit: () => {},
        userInfo: FIXTURE_USER_ACCOUNT_INFO,
        postMessage: () => {},
        chatEnabled: true,
    } satisfies ComponentProps<typeof Transcript>,

    decorators: [VSCodeWebview],
}

export default meta

export const Default: StoryObj<typeof meta> = {
    args: {},
}

export const Empty: StoryObj<typeof meta> = {
    args: {
        transcript: [],
    },
}

export const WithContext: StoryObj<typeof meta> = {
    args: {
        transcript: FIXTURE_TRANSCRIPT.explainCode2,
    },
}

const SIMPLE_TRANSCRIPT = FIXTURE_TRANSCRIPT.simple

export const WaitingForContext: StoryObj<typeof meta> = {
    args: {
        transcript: [...SIMPLE_TRANSCRIPT, { speaker: 'human', text: ps`What color is the sky?` }],
        messageInProgress: { speaker: 'assistant', model: 'my-llm' },
    },
}

export const WaitingForAssistantMessageWithContext: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            {
                speaker: 'human',
                text: ps`What color is the sky?'`,
                contextFiles: [{ type: 'file', uri: URI.file('/foo.js') }],
            },
        ]),
        messageInProgress: { speaker: 'assistant', model: 'my-llm' },
    },
}

export const WaitingForAssistantMessageNoContext: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            {
                speaker: 'human',
                text: ps`What color is the sky?'`,
                contextFiles: [],
            },
        ]),
        messageInProgress: { speaker: 'assistant', model: 'my-llm' },
    },
}

export const AssistantMessageInProgress: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            {
                speaker: 'human',
                text: ps`What color is the sky?'`,
                contextFiles: [{ type: 'file', uri: URI.file('/foo.js') }],
            },
        ]),
        messageInProgress: {
            speaker: 'assistant',
            model: 'my-model',
            text: ps`The sky is `,
        },
    },
}

export const WithError: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            { speaker: 'human', text: ps`What color is the sky?'`, contextFiles: [] },
            { speaker: 'assistant', error: errorToChatError(new Error('some error')) },
        ]),
        isTranscriptError: true,
    },
}

export const WithRateLimitError: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            { speaker: 'human', text: ps`What color is the sky?'`, contextFiles: [] },
            {
                speaker: 'assistant',
                error: errorToChatError(
                    new RateLimitError('chat messages and commands', 'rate limit error', true)
                ),
            },
        ]),
        isTranscriptError: true,
    },
}

export const abortedBeforeResponse: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            { speaker: 'human', text: ps`What color is the sky?'`, contextFiles: [] },
            { speaker: 'assistant', error: errorToChatError(new Error('aborted')) },
        ]),
        isTranscriptError: true,
    },
}

export const abortedWithPartialResponse: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            {
                speaker: 'human',
                text: ps`What color is the sky?`,
                contextFiles: [{ type: 'file', uri: URI.file('/foo.js') }],
            },
            { speaker: 'assistant', text: ps`Bl`, error: errorToChatError(new Error('aborted')) },
        ]),
        isTranscriptError: true,
    },
}

export const TextWrapping: StoryObj<typeof meta> = {
    args: {
        transcript: transcriptFixture([
            ...SIMPLE_TRANSCRIPT,
            {
                speaker: 'human',
                text: ps`What color is the skyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskyskysky?`,
                contextFiles: [],
            },
            {
                speaker: 'assistant',
                text: ps`The sky is blueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblue.\n\n\`\`\`\nconst color = 'blueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblue'\n\`\`\`\n\nMore info:\n\n- Color of sky: blueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblueblue`,
            },
        ]),
        isTranscriptError: true,
    },
}

export const Streaming: StoryObj<typeof meta> = {
    render: () => {
        const [args] = useArgs<Required<NonNullable<(typeof meta)['args']>>>()

        const [reply, setReply] = useState<string>('hello world, aaaaa bbbbb ccccc ')
        useEffect(() => {
            let i = 0
            const handle = setInterval(() => {
                setReply(
                    reply =>
                        reply +
                        ` ${String.fromCharCode(
                            Math.floor(Math.random() * 26 + 97)
                        )}${String.fromCharCode(
                            Math.floor(Math.random() * 26 + 97)
                        )}${String.fromCharCode(
                            Math.floor(Math.random() * 26 + 97)
                        )}${String.fromCharCode(Math.floor(Math.random() * 26 + 97))}${
                            i % 3 === 1
                                ? `\n\n\`\`\`javascript\nconst ${String.fromCharCode(
                                      Math.floor(Math.random() * 26 + 97)
                                  )} = ${Math.floor(Math.random() * 100)}\n\`\`\`\n`
                                : i % 3 === 2
                                  ? '\n\n* [item1](https://example.com)\n* item2: `hello`\n\n'
                                  : ''
                        }`
                )
                i++
            }, 1000)
            return () => clearInterval(handle)
        }, [])

        return (
            <Transcript
                {...args}
                transcript={transcriptFixture([
                    { speaker: 'human', text: ps`Hello, world!`, contextFiles: [] },
                ])}
                messageInProgress={{
                    speaker: 'assistant',
                    model: 'my-model',
                    text: PromptString.unsafe_fromLLMResponse(`${reply}`),
                }}
            />
        )
    },
}

export const StreamingThenFinish: StoryObj<typeof meta> = {
    render: () => {
        const [args] = useArgs<Required<NonNullable<(typeof meta)['args']>>>()

        const restartCounter = useRef(0)
        const restart = useCallback(() => {
            restartCounter.current++
            setReply('')
            document.querySelector<HTMLElement>('[role="row"]:last-child [data-lexical-editor]')?.focus()
        }, [])

        const ASSISTANT_MESSAGE = ps`hello, world!\n\n- a\n- b\n- c\n- d\n- e\n- f\n- g\n- h\n- i\n- j\n- k\n- l\n- m\n- n\n- o\n- p\n- q\n- r\n- s\n- t\n- u\n- v\n- w\n- x\n- y\n- z\n\nOK, done!`
        const [reply, setReply] = useState<string>('')
        useEffect(() => {
            let i = 0
            const PARTS = ASSISTANT_MESSAGE.split(' ')
            const handle = setInterval(() => {
                setReply(reply => `${reply ? `${reply} ` : ''}${PARTS.at(i)}`)
                if (i === PARTS.length - 1) {
                    clearInterval(handle)
                } else {
                    i++
                }
            }, 30)
            return () => clearInterval(handle)
        }, [restartCounter.current])

        const finished = reply === ASSISTANT_MESSAGE.toString()

        return (
            <>
                <button
                    type="button"
                    onClick={restart}
                    style={{ margin: '1rem', border: 'solid 1px #555', padding: '4px 6px' }}
                >
                    Restart simulated interaction
                </button>
                <Transcript
                    {...args}
                    transcript={transcriptFixture([
                        { speaker: 'human', text: ps`Hello, world!`, contextFiles: [] },
                        ...(finished
                            ? [{ speaker: 'assistant', text: ASSISTANT_MESSAGE } satisfies ChatMessage]
                            : []),
                    ])}
                    messageInProgress={
                        finished
                            ? null
                            : {
                                  speaker: 'assistant',
                                  model: 'my-model',
                                  text: PromptString.unsafe_fromLLMResponse(`${reply}`),
                              }
                    }
                />
            </>
        )
    },
}
