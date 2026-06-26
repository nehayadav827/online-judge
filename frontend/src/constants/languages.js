export const LANGUAGES = [
  { id: "cpp", name: "C++", monacoLang: "cpp" },
  { id: "java", name: "Java", monacoLang: "java" },
  { id: "python", name: "Python", monacoLang: "python" },
  { id: "javascript", name: "JavaScript", monacoLang: "javascript" },
];

export const DEFAULT_CODE = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string name;
    cin >> name;
    cout << "Hello, " << name << "!" << endl;
    return 0;
}`,

  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine();
        System.out.println("Hello, " + name + "!");
    }
}`,

  python: `name = input()
print(f"Hello, {name}!")`,

  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (name) => {
  console.log(\`Hello, \${name}!\`);
  rl.close();
});`,
};