# wonyoung_cv

간단한 정적 CV 페이지입니다.  
A simple static CV page.

브라우저에서 JSON을 읽어 이력서를 렌더링합니다.  
It renders a CV in the browser from JSON data.

## File Tree

```text
wonyoung_cv/
├─ index.html
├─ README.md
├─ assets/
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     ├─ app.js
│     ├─ filter.js        # optional
│     └─ filter.zip       # optional
├─ data/
│  ├─ resume.json
│  ├─ *.json
│  └─ *.zip
└─ refer/
```

## Main Files

### KO

- `index.html`: 메인 이력서 페이지
- `assets/js/app.js`: 데이터 로드, 이력서 렌더링, 필터 모듈 로드
- `assets/js/filter.js`: 평문 필터 모듈, 있으면 우선 사용
- `assets/js/filter.zip`: 보호된 필터 모듈, `filter.js`가 없을 때 사용
- `data/resume.json`: 기본 이력서 데이터
- `data/*.json`: 추가 공개 이력서 데이터
- `data/*.zip`: 추가 보호 이력서 데이터

### EN

- `index.html`: main CV page
- `assets/js/app.js`: data loading, CV rendering, filter module loading
- `assets/js/filter.js`: plain filter module, used first if present
- `assets/js/filter.zip`: protected filter module, used if `filter.js` is missing
- `data/resume.json`: default resume data
- `data/*.json`: additional public resume data
- `data/*.zip`: additional protected resume data

## How It Works

### KO

- 기본 접속 시 `data/resume.json`을 읽습니다.
- `source` 파라미터가 있으면 다른 파일을 읽습니다.
- `zip` 파일이면 비밀번호가 필요할 수 있습니다.
- 우측 상단 필터 버튼을 누르면 필터 기능을 불러옵니다.
- `filter.js`가 있으면 그 파일을 먼저 사용합니다.
- `filter.js`가 없으면 `filter.zip`을 열려고 시도합니다.

### EN

- By default, it loads `data/resume.json`.
- If `source` exists, it loads another file.
- If the source is a ZIP, a password may be required.
- The top-right filter button loads the filter feature.
- If `filter.js` exists, it is used first.
- If `filter.js` does not exist, it tries `filter.zip`.

## URL Parameters

### Basic

- `lang=ko|en`
- `name=Custom Name`
- `show=work,education,projects`
- `edu=middle+high+university`
- `hide=sections.0.items.1,sections.2.items.0`

### Source

- `source=resume_test`
- `source=resume_test.json`
- `source=resume_test.zip`

### Password

- `pw=your_password`

## Source Rules

### KO

- 파라미터가 없으면: `data/resume.json`
- `source=resume_test`
  - 먼저 `data/resume_test.json`
  - 없으면 `data/resume_test.zip`
- `source=resume_test.json`
  - `data/resume_test.json`
- `source=resume_test.zip`
  - `data/resume_test.zip`

### EN

- No parameter: `data/resume.json`
- `source=resume_test`
  - first `data/resume_test.json`
  - then `data/resume_test.zip`
- `source=resume_test.json`
  - `data/resume_test.json`
- `source=resume_test.zip`
  - `data/resume_test.zip`

## Examples

### Basic

```text
/
/?lang=ko
/?lang=en
```

### Source

```text
/?source=resume_test
/?source=resume_test.json
/?source=resume_test.zip
```

### Password

```text
/?source=resume_test&pw=myPassword
/?source=resume_test.zip&pw=myPassword
```

### Name / Language

```text
/?name=Jang%20Wonyoung
/?source=resume_test&lang=ko
/?source=resume_test&lang=en&name=Wonyoung
```

### Filter Share Examples

```text
/?hide=sections.0.items.1
/?source=resume_test&pw=myPassword&hide=sections.0.items.1
/?show=work,projects&lang=en
```

## Filter Notes

### KO

- 필터는 메인 데이터 로드와 별개입니다.
- 필터가 없어도 이력서는 정상 표시됩니다.
- 필터가 있으면 항목을 트리 형태로 숨기거나 보이게 할 수 있습니다.
- 현재 필터 상태는 드로어 안에서 공유 링크로 복사할 수 있습니다.

### EN

- The filter is separate from the main data load.
- The CV still works even if the filter is unavailable.
- If available, the filter can hide/show items in a tree view.
- The current filter state can be copied as a shareable URL from the drawer.

## Security Note

### KO

퍼블릭 GitHub Pages에서 ZIP 비밀번호 방식은 완전한 보안이 아닙니다.  
브라우저에서 복호화하므로 접근 장벽 정도로 생각하는 것이 맞습니다.

### EN

Password-protected ZIP usage on public GitHub Pages is not true security.  
Because decryption happens in the browser, treat it as a barrier, not full protection.
