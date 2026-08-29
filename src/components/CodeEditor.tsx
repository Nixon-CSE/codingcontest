import { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, Send, RotateCcw, Cloud, Check, Loader2, Code, Settings2 } from 'lucide-react';
import { Problem } from '../types';
import { ApiService } from '../api';

export interface CodeEditorProps {
  problem: Problem;
  participantId?: string;
  onRunCode: (language: string, code: string) => Promise<void>;
  onSubmitCode: (language: string, code: string) => Promise<void>;
  isRunning: boolean;
  isSubmitting: boolean;
  isContestExpired: boolean;
}

const DEFAULT_TEMPLATES: Record<string, (problemId: string) => string> = {
  python: (probId: string) => {
    if (probId.includes('road-bump') || probId.includes('prob-1')) {
      return `# Solution for Question 1: Smart Road Bump Detector
import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    heights = [int(x) for x in input_data[1:n+1]]
    
    # TODO: Determine bumps, 1-based positions, and maximum bump height
    pass

if __name__ == '__main__':
    solve()
`;
    } else if (probId.includes('unique-character') || probId.includes('prob-2')) {
      return `# Solution for Question 2: First Unique Character
import sys

def solve():
    s = sys.stdin.read().strip()
    if not s:
        print("-1")
        return
        
    # TODO: Find first character examined left-to-right occurring exactly once (case-sensitive)
    pass

if __name__ == '__main__':
    solve()
`;
    } else if (probId.includes('minimum-coins') || probId.includes('prob-3')) {
      return `# Solution for Question 3: Minimum Coins
import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    coins = [int(x) for x in input_data[1:n+1]]
    amount = int(input_data[n+1])
    
    # TODO: Determine minimum number of coins to form target amount A
    pass

if __name__ == '__main__':
    solve()
`;
    } else if (probId.includes('two-sum') || probId.includes('prob-4')) {
      return `# Solution for Question 4: Two Sum
import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    
    # TODO: Find two 0-based indices whose values sum to target
    pass

if __name__ == '__main__':
    solve()
`;
    } else if (probId.includes('emergency-route') || probId.includes('prob-5')) {
      return `# Solution for Question 5: Emergency Route
import sys
from collections import deque

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    r = int(input_data[0])
    c = int(input_data[1])
    
    grid = []
    idx = 2
    for _ in range(r):
        grid.append([int(x) for x in input_data[idx:idx+c]])
        idx += c
        
    # TODO: Determine if open-road path exists from (0, 0) to (r-1, c-1)
    pass

if __name__ == '__main__':
    solve()
`;
    }
    return `# Write your solution in Python 3
import sys

def solve():
    input_data = sys.stdin.read().splitlines()
    # TODO: implement logic here
    pass

if __name__ == '__main__':
    solve()
`;
  },
  cpp: () => `#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // TODO: implement your competitive solution
    
    return 0;
}
`,
  java: () => `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st;
        
        // TODO: implement solution
    }
}
`,
  javascript: () => `// JavaScript Solution (Node.js runtime)
const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    
    // Process input lines
    console.log("Output");
}

solve();
`,
};

export function CodeEditor({
  problem,
  participantId,
  onRunCode,
  onSubmitCode,
  isRunning,
  isSubmitting,
  isContestExpired,
}: CodeEditorProps) {
  const [language, setLanguage] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');
  const [code, setCode] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const editorRef = useRef<any>(null);
  const debounceTimerRef = useRef<any>(null);

  // Load draft or initial template on problem or language change
  useEffect(() => {
    let isMounted = true;

    async function loadCode() {
      try {
        const res = await ApiService.getDraft(problem.id, participantId);
        if (isMounted && res.draft && res.draft.code) {
          setCode(res.draft.code);
          if (res.draft.language) {
            setLanguage(res.draft.language as any);
          }
          setSaveStatus('saved');
          return;
        }
      } catch {
        // Fallback to template
      }

      if (isMounted) {
        const templateFn = DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.python;
        setCode(templateFn(problem.id));
      }
    }

    loadCode();

    return () => {
      isMounted = false;
    };
  }, [problem.id, participantId]);

  // Debounced Autosave to backend
  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || '';
    setCode(val);
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await ApiService.saveDraft(problem.id, language, val, participantId);
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        setSaveStatus('idle');
      }
    }, 2000);
  };

  const handleLanguageChange = (newLang: 'python' | 'cpp' | 'java' | 'javascript') => {
    setLanguage(newLang);
    const templateFn = DEFAULT_TEMPLATES[newLang] || DEFAULT_TEMPLATES.python;
    const newCode = templateFn(problem.id);
    setCode(newCode);
    handleCodeChange(newCode);
  };

  const handleResetTemplate = () => {
    if (confirm('Reset editor to default template? Unsaved changes will be replaced.')) {
      const templateFn = DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.python;
      const newCode = templateFn(problem.id);
      setCode(newCode);
      handleCodeChange(newCode);
    }
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] text-gray-200">
      {/* Top Editor Toolbar */}
      <div className="bg-[#1a1a1e] border-b border-white/5 px-4 h-10 flex items-center justify-between gap-3 flex-wrap flex-none">
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400">solution.{language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'javascript' ? 'js' : 'py'}</span>
            <span className="text-gray-600">•</span>
            <select
              id="language-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="bg-transparent text-[11px] font-semibold text-indigo-400 outline-none border-none cursor-pointer uppercase tracking-tight"
            >
              <option value="python" className="bg-[#121214] text-gray-200">Python 3.10</option>
              <option value="cpp" className="bg-[#121214] text-gray-200">C++ 17 (GCC 9.2)</option>
              <option value="java" className="bg-[#121214] text-gray-200">Java 11 (OpenJDK)</option>
              <option value="javascript" className="bg-[#121214] text-gray-200">JavaScript (Node.js)</option>
            </select>
          </div>

          {/* Autosave Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-semibold ml-2">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-400">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span>Autosave: {lastSavedTime ? lastSavedTime : 'synced'}</span>
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3 text-gray-600" />
                <span>Autosave: active</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls (Reset, Run Code, Submit) */}
        <div className="flex items-center gap-2">
          <button
            id="btn-reset-code"
            onClick={handleResetTemplate}
            title="Reset to boilerplate code"
            disabled={isRunning || isSubmitting}
            className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Code (Sample tests only) */}
          <button
            id="btn-run-code"
            onClick={() => onRunCode(language, code)}
            disabled={isRunning || isSubmitting}
            className="px-4 h-7 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded border border-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                <span>Run Samples</span>
              </>
            )}
          </button>

          {/* Submit (Official scoring against hidden tests) */}
          <button
            id="btn-submit-code"
            onClick={() => onSubmitCode(language, code)}
            disabled={isRunning || isSubmitting || isContestExpired}
            className={`px-5 h-7 font-bold text-[11px] uppercase tracking-widest rounded border transition-all flex items-center gap-1.5 shadow-lg ${
              isContestExpired
                ? 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border-indigo-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-white" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>{isContestExpired ? 'Closed' : 'Submit Solution'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Area */}
      <div className="flex-1 w-full relative min-h-[300px] bg-[#121214]">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language === 'javascript' ? 'javascript' : language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            padding: { top: 14, bottom: 14 },
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, Menlo, monospace",
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
          }}
        />
      </div>
    </div>
  );
}
