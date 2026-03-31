# 需求文档

## 编号
sdd-003

## 标题
查询页 Tab 跟随当前连接 Tab

## 背景
用户反馈：当打开多个连接 tab 页时，切换连接 tab 页后，左侧的数据库列表会跟随变动，但查询页没有跟随变动。需要让查询页也跟随当前连接的 tab 页。

## 需求描述
ContentTabManager 需要根据当前 dbKey 过滤显示对应的查询页 tab，而不是显示所有连接的查询页。

## 详细需求

### 1. 过滤查询页 Tab
- ContentTabManager 接收 `dbKey` 属性
- 只显示 `dbKey` 等于当前连接 key 的查询页 tab
- 切换连接 tab 时，查询页列表自动切换

### 2. 新建查询时关联 dbKey
- 点击 + 按钮新建查询时，需要将当前连接的 `dbKey` 传递给新 tab
- 确保新建的查询页属于当前连接

### 3. 活动 Tab 切换逻辑
- 当前活动的内容 tab 需要在过滤后的列表中查找
- 如果当前活动 tab 不属于当前连接，则显示过滤后的第一个 tab

## 验收标准
1. 切换连接 tab 时，查询页 tab 列表随之切换
2. 新建查询时，查询页正确关联到当前连接
3. 各连接的查询页相互独立，不混在一起

## 相关文件
- `src/modules/ContentTabManager.tsx`
- `src/store/useConnectionStore.ts` - ContentTab 类型定义

## 创建时间
2026-03-31