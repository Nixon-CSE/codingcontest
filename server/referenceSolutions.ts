/**
 * Official Reference Solutions for Contest Problem Set (5 Questions)
 * STRICTLY RESTRICTED TO ADMINISTRATOR & SERVER-SIDE VALIDATION
 * Participants do not have access to these solutions.
 */

export interface ReferenceSolution {
  problemId: string;
  problemTitle: string;
  order: number;
  marks: number;
  timeComplexity: string;
  spaceComplexity: string;
  python: string;
  cpp: string;
  java: string;
  javascript: string;
}

export const REFERENCE_SOLUTIONS: Record<string, ReferenceSolution> = {
  'prob-1-smart-road-bump-detector': {
    problemId: 'prob-1-smart-road-bump-detector',
    problemTitle: 'Smart Road Bump Detector',
    order: 1,
    marks: 15,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    heights = [int(x) for x in input_data[1:n+1]]
    
    bumps = []
    max_height = -1
    
    # 1-based positions from 2 to N-1 (0-based indices from 1 to N-2)
    for i in range(1, n - 1):
        if heights[i] > heights[i - 1] and heights[i] > heights[i + 1]:
            bumps.append(i + 1)
            if heights[i] > max_height:
                max_height = heights[i]
                
    if not bumps:
        print("0")
        print("None")
        print("-1")
    else:
        print(len(bumps))
        print(" ".join(str(p) for p in bumps))
        print(max_height)

if __name__ == '__main__':
    solve()
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    vector<int> heights(n);
    for (int i = 0; i < n; i++) {
        cin >> heights[i];
    }

    vector<int> bumps;
    int maxHeight = -1;

    for (int i = 1; i < n - 1; i++) {
        if (heights[i] > heights[i - 1] && heights[i] > heights[i + 1]) {
            bumps.push_back(i + 1); // 1-based index
            if (heights[i] > maxHeight) {
                maxHeight = heights[i];
            }
        }
    }

    if (bumps.empty()) {
        cout << 0 << "\nNone\n-1\n";
    } else {
        cout << bumps.size() << "\n";
        for (size_t i = 0; i < bumps.size(); i++) {
            cout << bumps[i] << (i + 1 == bumps.size() ? "" : " ");
        }
        cout << "\n" << maxHeight << "\n";
    }

    return 0;
}
`,
    java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.StringTokenizer;
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        
        int n = Integer.parseInt(line.trim());
        int[] heights = new int[n];
        
        StringTokenizer st = null;
        for (int i = 0; i < n; i++) {
            while (st == null || !st.hasMoreTokens()) {
                String l = br.readLine();
                if (l == null) break;
                st = new StringTokenizer(l);
            }
            if (st != null && st.hasMoreTokens()) {
                heights[i] = Integer.parseInt(st.nextToken());
            }
        }

        List<Integer> bumps = new ArrayList<>();
        int maxHeight = -1;

        for (int i = 1; i < n - 1; i++) {
            if (heights[i] > heights[i - 1] && heights[i] > heights[i + 1]) {
                bumps.add(i + 1);
                if (heights[i] > maxHeight) {
                    maxHeight = heights[i];
                }
            }
        }

        if (bumps.isEmpty()) {
            System.out.println("0\nNone\n-1");
        } else {
            System.out.println(bumps.size());
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < bumps.size(); i++) {
                if (i > 0) sb.append(" ");
                sb.append(bumps.get(i));
            }
            System.out.println(sb.toString());
            System.out.println(maxHeight);
        }
    }
}
`,
    javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    
    const n = parseInt(input[0], 10);
    const heights = [];
    for (let i = 1; i <= n; i++) {
        heights.push(parseInt(input[i], 10));
    }
    
    const bumps = [];
    let maxHeight = -1;
    
    for (let i = 1; i < n - 1; i++) {
        if (heights[i] > heights[i - 1] && heights[i] > heights[i + 1]) {
            bumps.push(i + 1);
            if (heights[i] > maxHeight) {
                maxHeight = heights[i];
            }
        }
    }
    
    if (bumps.length === 0) {
        console.log("0\\nNone\\n-1");
    } else {
        console.log(bumps.length);
        console.log(bumps.join(" "));
        console.log(maxHeight);
    }
}

solve();
`,
  },

  'prob-2-first-unique-character': {
    problemId: 'prob-2-first-unique-character',
    problemTitle: 'First Unique Character',
    order: 2,
    marks: 10,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1) - alphabet size <= 52',
    python: `import sys

def solve():
    s = sys.stdin.read().strip()
    if not s:
        print("-1")
        return
        
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
        
    for ch in s:
        if counts[ch] == 1:
            print(ch)
            return
            
    print("-1")

if __name__ == '__main__':
    solve()
`,
    cpp: `#include <iostream>
#include <string>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string s;
    if (!(cin >> s)) {
        cout << "-1\n";
        return 0;
    }

    unordered_map<char, int> counts;
    for (char c : s) {
        counts[c]++;
    }

    for (char c : s) {
        if (counts[c] == 1) {
            cout << c << "\n";
            return 0;
        }
    }

    cout << "-1\n";
    return 0;
}
`,
    java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        if (s == null || s.trim().isEmpty()) {
            System.out.println("-1");
            return;
        }
        s = s.trim();

        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            counts.put(c, counts.getOrDefault(c, 0) + 1);
        }

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (counts.get(c) == 1) {
                System.out.println(c);
                return;
            }
        }

        System.out.println("-1");
    }
}
`,
    javascript: `const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    if (!s) {
        console.log("-1");
        return;
    }

    const counts = new Map();
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        counts.set(c, (counts.get(c) || 0) + 1);
    }

    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (counts.get(c) === 1) {
            console.log(c);
            return;
        }
    }

    console.log("-1");
}

solve();
`,
  },

  'prob-3-minimum-coins': {
    problemId: 'prob-3-minimum-coins',
    problemTitle: 'Minimum Coins',
    order: 3,
    marks: 20,
    timeComplexity: 'O(N * A)',
    spaceComplexity: 'O(A)',
    python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    coins = [int(x) for x in input_data[1:n+1]]
    amount = int(input_data[n+1])
    
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for i in range(1, amount + 1):
        for c in coins:
            if i >= c and dp[i - c] != float('inf'):
                dp[i] = min(dp[i], dp[i - c] + 1)
                
    print(dp[amount] if dp[amount] != float('inf') else -1)

if __name__ == '__main__':
    solve()
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    vector<int> coins(n);
    for (int i = 0; i < n; i++) {
        cin >> coins[i];
    }

    int amount;
    cin >> amount;

    const int INF = 1e9;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int c : coins) {
            if (i >= c && dp[i - c] != INF) {
                dp[i] = min(dp[i], dp[i - c] + 1);
            }
        }
    }

    cout << (dp[amount] == INF ? -1 : dp[amount]) << "\n";
    return 0;
}
`,
    java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        
        int n = Integer.parseInt(line.trim());
        int[] coins = new int[n];
        
        StringTokenizer st = null;
        for (int i = 0; i < n; i++) {
            while (st == null || !st.hasMoreTokens()) {
                String l = br.readLine();
                if (l == null) break;
                st = new StringTokenizer(l);
            }
            if (st != null && st.hasMoreTokens()) {
                coins[i] = Integer.parseInt(st.nextToken());
            }
        }

        while (st == null || !st.hasMoreTokens()) {
            String l = br.readLine();
            if (l == null) break;
            st = new StringTokenizer(l);
        }
        int amount = Integer.parseInt(st.nextToken());

        int[] dp = new int[amount + 1];
        Arrays.fill(dp, 1000000000);
        dp[0] = 0;

        for (int i = 1; i <= amount; i++) {
            for (int c : coins) {
                if (i >= c && dp[i - c] != 1000000000) {
                    dp[i] = Math.min(dp[i], dp[i - c] + 1);
                }
            }
        }

        System.out.println(dp[amount] >= 1000000000 ? -1 : dp[amount]);
    }
}
`,
    javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    
    const n = parseInt(input[0], 10);
    const coins = [];
    for (let i = 1; i <= n; i++) {
        coins.push(parseInt(input[i], 10));
    }
    const amount = parseInt(input[n + 1], 10);
    
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    
    for (let i = 1; i <= amount; i++) {
        for (const c of coins) {
            if (i >= c && dp[i - c] !== Infinity) {
                dp[i] = Math.min(dp[i], dp[i - c] + 1);
            }
        }
    }
    
    console.log(dp[amount] === Infinity ? -1 : dp[amount]);
}

solve();
`,
  },

  'prob-4-two-sum': {
    problemId: 'prob-4-two-sum',
    problemTitle: 'Two Sum',
    order: 4,
    marks: 10,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    
    seen = {}
    for i in range(n):
        comp = target - nums[i]
        if comp in seen:
            print(f"{seen[comp]} {i}")
            return
        seen[nums[i]] = i

if __name__ == '__main__':
    solve()
`,
    cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    vector<long long> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    long long target;
    cin >> target;

    unordered_map<long long, int> seen;
    for (int i = 0; i < n; i++) {
        long long comp = target - nums[i];
        if (seen.find(comp) != seen.end()) {
            cout << seen[comp] << " " << i << "\n";
            return 0;
        }
        seen[nums[i]] = i;
    }

    return 0;
}
`,
    java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;
import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;

        int n = Integer.parseInt(line.trim());
        long[] nums = new long[n];

        StringTokenizer st = null;
        for (int i = 0; i < n; i++) {
            while (st == null || !st.hasMoreTokens()) {
                String l = br.readLine();
                if (l == null) break;
                st = new StringTokenizer(l);
            }
            if (st != null && st.hasMoreTokens()) {
                nums[i] = Long.parseLong(st.nextToken());
            }
        }

        while (st == null || !st.hasMoreTokens()) {
            String l = br.readLine();
            if (l == null) break;
            st = new StringTokenizer(l);
        }
        long target = Long.parseLong(st.nextToken());

        Map<Long, Integer> seen = new HashMap<>();
        for (int i = 0; i < n; i++) {
            long comp = target - nums[i];
            if (seen.containsKey(comp)) {
                System.out.println(seen.get(comp) + " " + i);
                return;
            }
            seen.put(nums[i], i);
        }
    }
}
`,
    javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;

    const n = parseInt(input[0], 10);
    const nums = [];
    for (let i = 1; i <= n; i++) {
        nums.push(Number(input[i]));
    }
    const target = Number(input[n + 1]);

    const seen = new Map();
    for (let i = 0; i < n; i++) {
        const comp = target - nums[i];
        if (seen.has(comp)) {
            console.log(\`\${seen.get(comp)} \${i}\`);
            return;
        }
        seen.set(nums[i], i);
    }
}

solve();
`,
  },

  'prob-5-emergency-route': {
    problemId: 'prob-5-emergency-route',
    problemTitle: 'Emergency Route',
    order: 5,
    marks: 20,
    timeComplexity: 'O(R * C)',
    spaceComplexity: 'O(R * C)',
    python: `import sys
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
        row = [int(x) for x in input_data[idx:idx+c]]
        grid.append(row)
        idx += c
        
    if grid[0][0] != 0 or grid[r-1][c-1] != 0:
        print("No Path")
        return
        
    if r == 1 and c == 1:
        print("Path Exists")
        return
        
    queue = deque([(0, 0)])
    grid[0][0] = 1 # Mark visited
    
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    while queue:
        cr, cc = queue.popleft()
        if cr == r - 1 and cc == c - 1:
            print("Path Exists")
            return
        for dr, dc in dirs:
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < r and 0 <= nc < c and grid[nr][nc] == 0:
                grid[nr][nc] = 1 # Mark visited
                queue.append((nr, nc))
                
    print("No Path")

if __name__ == '__main__':
    solve()
`,
    cpp: `#include <iostream>
#include <vector>
#include <queue>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int r, c;
    if (!(cin >> r >> c)) return 0;

    vector<vector<int>> grid(r, vector<int>(c));
    for (int i = 0; i < r; i++) {
        for (int j = 0; j < c; j++) {
            cin >> grid[i][j];
        }
    }

    if (grid[0][0] != 0 || grid[r - 1][c - 1] != 0) {
        cout << "No Path\n";
        return 0;
    }

    if (r == 1 && c == 1) {
        cout << "Path Exists\n";
        return 0;
    }

    queue<pair<int, int>> q;
    q.push({0, 0});
    grid[0][0] = 1; // Visited

    int dr[] = {-1, 1, 0, 0};
    int dc[] = {0, 0, -1, 1};

    while (!q.empty()) {
        auto [cr, cc] = q.front();
        q.pop();

        if (cr == r - 1 && cc == c - 1) {
            cout << "Path Exists\n";
            return 0;
        }

        for (int i = 0; i < 4; i++) {
            int nr = cr + dr[i];
            int nc = cc + dc[i];
            if (nr >= 0 && nr < r && nc >= 0 && nc < c && grid[nr][nc] == 0) {
                grid[nr][nc] = 1;
                q.push({nr, nc});
            }
        }
    }

    cout << "No Path\n";
    return 0;
}
`,
    java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayDeque;
import java.util.Queue;
import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;

        StringTokenizer st = new StringTokenizer(line);
        int r = Integer.parseInt(st.nextToken());
        int c = Integer.parseInt(st.nextToken());

        int[][] grid = new int[r][c];
        for (int i = 0; i < r; i++) {
            while (st == null || !st.hasMoreTokens()) {
                String l = br.readLine();
                if (l == null) break;
                st = new StringTokenizer(l);
            }
            for (int j = 0; j < c; j++) {
                if (st != null && st.hasMoreTokens()) {
                    grid[i][j] = Integer.parseInt(st.nextToken());
                }
            }
        }

        if (grid[0][0] != 0 || grid[r - 1][c - 1] != 0) {
            System.out.println("No Path");
            return;
        }

        if (r == 1 && c == 1) {
            System.out.println("Path Exists");
            return;
        }

        Queue<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0});
        grid[0][0] = 1; // Visited

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        while (!queue.isEmpty()) {
            int[] curr = queue.poll();
            int cr = curr[0];
            int cc = curr[1];

            if (cr == r - 1 && cc == c - 1) {
                System.out.println("Path Exists");
                return;
            }

            for (int i = 0; i < 4; i++) {
                int nr = cr + dr[i];
                int nc = cc + dc[i];
                if (nr >= 0 && nr < r && nc >= 0 && nc < c && grid[nr][nc] == 0) {
                    grid[nr][nc] = 1;
                    queue.add(new int[]{nr, nc});
                }
            }
        }

        System.out.println("No Path");
    }
}
`,
    javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;

    const r = parseInt(input[0], 10);
    const c = parseInt(input[1], 10);

    const grid = [];
    let idx = 2;
    for (let i = 0; i < r; i++) {
        const row = [];
        for (let j = 0; j < c; j++) {
            row.push(parseInt(input[idx++], 10));
        }
        grid.push(row);
    }

    if (grid[0][0] !== 0 || grid[r - 1][c - 1] !== 0) {
        console.log("No Path");
        return;
    }

    if (r === 1 && c === 1) {
        console.log("Path Exists");
        return;
    }

    const queue = [[0, 0]];
    grid[0][0] = 1; // Mark visited

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
        const [cr, cc] = queue.shift();

        if (cr === r - 1 && cc === c - 1) {
            console.log("Path Exists");
            return;
        }

        for (const [dr, dc] of dirs) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < r && nc >= 0 && nc < c && grid[nr][nc] === 0) {
                grid[nr][nc] = 1;
                queue.push([nr, nc]);
            }
        }
    }

    console.log("No Path");
}

solve();
`,
  },
};
