module.exports = [{
    // 智慧济大用户名密码
    username: '',
    password: '',
    // 从智慧济大办事大厅填报
    ehall: true,
    // 从返校健康卡填报
    card: false,
    // 若为false 则不使用微信登入 使用则填写微信智慧济大返校健康卡的openid
    wechatOpenId: false,
    details: {
        // 填报日期 留空即可
        TBRQ: '',
        // 我不知道这是做啥的 保留
        _t: 3,
        // 姓名
        XM: "",
        // 学号
        XH: "",
        // 学院
        SZXY: "",
        // 手机号
        SJH: "",
        // 地址部分不确定的话可以去看看智慧济大 或者调用ehall.getProvience()等函数
        // 这里两行都要填
        // 家庭所在省
        SHENG_TEXT: "",
        SHENG: "",
        // 家庭所在市
        SHI_TEXT: "",
        SHI: "",
        // 家庭所在区
        QU_TEXT: "",
        QU: "",
        // 国内还是国外
        GNGW_TEXT: "",
        GNGW: "",
        // 目前所在省
        MQS_TEXT: "",
        MQS: "",
        // 目前所在市
        MQSH_TEXT: "",
        MQSH: "",
        // 目前所在区
        MQQ_TEXT: "",
        MQQ: "",
        // 国外地址(选国外才写)
        GWDZ: "",
        // 是否离开居住地
        SFLKJZD: "否",
        // 离开时间
        LKSJ: "",
        // 到达时间
        DDSJ: "",
        // 路线
        LX: "",
        // 出行方式 这个也需要参考智慧济大
        CXFS_TEXT: "请选择",
        CXFS: "",
        // 车牌号
        CPH: "",
        // 08/03/2021新增
        // 目前所在地风险等级 有 低风险 中风险 高风险
        MQSZDFXDJ: "低风险",
        // 是否医学隔离
        SFYXGL: "否",
        // 发热情况 这个貌似是系统给填写的 分有 不发热 低热（37.3-38度） 中热(38.1-39度) 高热(39.1度以上)
        FRQK: "不发热",
        // 是否感染COVID-19
        SFGRXGFY: "否",
        // 感染类型 这个也要参考智慧济大
        GRLX_TEXT: "请选择",
        GRLX: "",
        // 本人或家庭是否为密切接触者
        BRHJTSFWMQJC: "否",
        // 14天内本人或家庭成员是否有中高风险地区旅居史、接触史
        ZGFXDQLXS: "否",
        // 21天内所居住社区是否发生疫情
        SQCJSFFSYQ: "否",
        // 体温部分留空 自动生成
        // 上午体温
        SWTW: "36.5",
        // 中午体温
        ZHWTW: "36.5",
        // 下午体温
        XWTW: "36.5",
        // 时间戳 留空即可
        SJC: "",
        // 下面不需要管
        _o: {
            TBRQ: null,
            XM: null,
            XH: null,
            SZXY: null,
            SJH: null,
            SHENG_TEXT: null,
            SHENG: null,
            SHI_TEXT: null,
            SHI: null,
            QU_TEXT: null,
            QU: null,
            GNGW_TEXT: null,
            GNGW: null,
            MQS_TEXT: null,
            MQS: null,
            MQSH_TEXT: null,
            MQSH: null,
            MQQ_TEXT: null,
            MQQ: null,
            GWDZ: null,
            SFLKJZD: null,
            LKSJ: null,
            DDSJ: null,
            LX: null,
            CXFS_TEXT: null,
            CXFS: null,
            CPH: null,
            MQSZDFXDJ: null,
            SFYXGL: null,
            FRQK: null,
            SFGRXGFY: null,
            GRLX_TEXT: null,
            GRLX: null,
            BRHJTSFWMQJC: null,
            ZGFXDQLXS: null,
            SQCJSFFSYQ: null,
            SWTW: null,
            ZHWTW: null,
            XWTW: null,
            SJC: null
        }

    }
}]