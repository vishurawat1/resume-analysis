"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { useTheme } from "next-themes";

export interface LatexCodeEditorHandle {
  insertAtCursor: (snippet: string) => void;
  goToLine: (lineNumber: number) => void;
  focus: () => void;
}

interface LatexCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCompileShortcut?: () => void;
  fontSize?: number;
}

const lightEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#ffffff",
    color: "#18181b",
    height: "100%",
  },
  ".cm-gutters": {
    backgroundColor: "#f8fafc",
    color: "#94a3b8",
    borderRight: "1px solid #e2e8f0",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(59, 130, 246, 0.06)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontWeight: "600",
  },
});

const darkEditorThemeOverrides = EditorView.theme({
  "&": {
    height: "100%",
  },
  ".cm-gutters": {
    borderRight: "1px solid #27272a",
  },
});

export const LatexCodeEditor = forwardRef<LatexCodeEditorHandle, LatexCodeEditorProps>(
  function LatexCodeEditor({ value, onChange, onCompileShortcut, fontSize = 13 }, ref) {
    const cmRef = useRef<ReactCodeMirrorRef>(null);
    const { resolvedTheme } = useTheme();
    const compileCallbackRef = useRef(onCompileShortcut);
    const latestValueRef = useRef(value);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      compileCallbackRef.current = onCompileShortcut;
      latestValueRef.current = value;
      onChangeRef.current = onChange;
    }, [onCompileShortcut, value, onChange]);

    useImperativeHandle(ref, () => ({
      insertAtCursor(snippet: string) {
        const view = cmRef.current?.view;
        if (!view) {
          onChangeRef.current(`${latestValueRef.current}\n${snippet}`);
          return;
        }
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: snippet },
          selection: { anchor: from + snippet.length },
          scrollIntoView: true,
        });
        view.focus();
      },
      goToLine(lineNumber: number) {
        const view = cmRef.current?.view;
        if (!view) return;
        const clampedLine = Math.max(1, Math.min(lineNumber, view.state.doc.lines));
        const lineInfo = view.state.doc.line(clampedLine);
        view.dispatch({
          selection: { anchor: lineInfo.from, head: lineInfo.to },
          effects: EditorView.scrollIntoView(lineInfo.from, { y: "center" }),
        });
        view.focus();
      },
      focus() {
        cmRef.current?.view?.focus();
      },
    }));

    const extensions = useMemo(() => {
      return [
        latex({
          autoCloseTags: true,
          autoCloseBrackets: true,
          enableAutocomplete: true,
          enableTooltips: false,
          enableLinting: true,
          linter: {
            checkUnclosedBraces: true,
            checkUnmatchedEnvironments: true,
            checkMissingDocumentEnv: true,
            checkDeprecatedCommands: false,
            checkMissingPackages: false,
            checkMissingReferences: false,
            checkCitesWithoutBibliography: false,
            checkDuplicateLabels: false,
            checkMathModeCommands: false,
          },
        }),
        EditorView.lineWrapping,
        Prec.highest(
          keymap.of([
            {
              key: "Mod-s",
              run: () => {
                compileCallbackRef.current?.();
                return true;
              },
            },
            {
              key: "Mod-Enter",
              run: () => {
                compileCallbackRef.current?.();
                return true;
              },
            },
          ])
        ),
        EditorView.theme({
          ".cm-scroller": {
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: `${fontSize}px`,
            lineHeight: "1.6",
          },
        }),
        resolvedTheme === "dark" ? darkEditorThemeOverrides : lightEditorTheme,
      ];
    }, [fontSize, resolvedTheme]);

    return (
      <div className="w-full h-full min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          ref={cmRef}
          value={value}
          height="100%"
          className="h-full w-full"
          theme={resolvedTheme === "dark" ? oneDark : "light"}
          extensions={extensions}
          onChange={(val) => onChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            searchKeymap: true,
            tabSize: 2,
          }}
        />
      </div>
    );
  }
);
