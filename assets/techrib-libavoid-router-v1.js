import { AvoidLib } from './libavoid-v031.js';

const WASM_URL = ((window.__LUCASAGUIAR_BASE_PATH__||'/')+'assets/libavoid-v031.wasm');

function centerRect(r) {
    return {
        x: (r.left + r.right) / 2,
        y: (r.top + r.bottom) / 2
    };
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function normalizeSide(side) {
    const s = String(side || '').toLowerCase();

    if (['top', 'up', 'cima'].includes(s)) return 'top';
    if (['bottom', 'down', 'baixo'].includes(s)) return 'bottom';
    if (['left', 'esquerda'].includes(s)) return 'left';
    if (['right', 'direita'].includes(s)) return 'right';

    return null;
}

function semanticSide(type, terminal, explicitSide) {

    const explicit = normalizeSide(explicitSide);
    if (explicit) return explicit;

    const t = String(terminal || '').toUpperCase();
    const typeName = String(type || '').toLowerCase();

    if (typeName === 'fonte-trifasica') {
        return 'bottom';
    }

    if (typeName === 'disjuntor-3p') {
        if (['1','3','5'].includes(t)) return 'top';
        if (['2','4','6'].includes(t)) return 'bottom';
    }

    if (typeName === 'contator') {
        if (['L1','L2','L3'].includes(t)) return 'top';
        if (['T1','T2','T3'].includes(t)) return 'bottom';
        if (['A1','A2','11','12'].includes(t)) return 'right';
        if (['13','14'].includes(t)) return 'left';
    }

    if (typeName === 'rele-termico') {
        if (['T1','T2','T3'].includes(t)) return 'top';
        if (['2','4','6'].includes(t)) return 'bottom';
        if (['95','96','97','98'].includes(t)) return 'right';
    }

    if (typeName === 'rele-falta-fase') {
        if (['L1','L2','L3'].includes(t)) return 'top';
        if (['11','12','14'].includes(t)) return 'bottom';
    }

    if (typeName === 'bomba-trifasica') {
        if (['U','V','W'].includes(t)) return 'top';
        if (t === 'PE') return 'right';
    }

    if (
        typeName.includes('botoeira') ||
        typeName.includes('sinaleiro')
    ) {
        return 'bottom';
    }

    return null;
}

function geometricSide(componentRect, terminalRect) {

    const p = centerRect(terminalRect);

    const d = {
        top: Math.abs(p.y - componentRect.top),
        bottom: Math.abs(componentRect.bottom - p.y),
        left: Math.abs(p.x - componentRect.left),
        right: Math.abs(componentRect.right - p.x)
    };

    return Object.entries(d)
        .sort((a,b) => a[1] - b[1])[0][0];
}

function rectOf(el) {
    if (!el?.getBoundingClientRect) return null;

    const r = el.getBoundingClientRect();

    return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height
    };
}

function routePoints(route) {

    const pts = [];

    for (let i = 0; i < route.size(); i++) {

        let p;

        if (typeof route.get_ps === 'function') {
            p = route.get_ps(i);
        }
        else if (typeof route.at === 'function') {
            p = route.at(i);
        }
        else {
            throw new Error(
                'API desconhecida para leitura da rota'
            );
        }

        pts.push({
            x: Number(p.x),
            y: Number(p.y)
        });
    }

    return pts;
}

function samePoint(a,b,EPS=0.01) {
    return (
        Math.abs(a.x - b.x) <= EPS &&
        Math.abs(a.y - b.y) <= EPS
    );
}

function orthogonalBridge(terminalPoint,routePoint,side) {

    const out = [{x:terminalPoint.x,y:terminalPoint.y}];

    if (
        !samePoint(terminalPoint,routePoint) &&
        Math.abs(terminalPoint.x - routePoint.x) > 0.01 &&
        Math.abs(terminalPoint.y - routePoint.y) > 0.01
    ) {
        const elbow = side === 'left' || side === 'right'
            ? {x:routePoint.x,y:terminalPoint.y}
            : {x:terminalPoint.x,y:routePoint.y};

        if (!samePoint(out[out.length - 1],elbow)) {
            out.push(elbow);
        }
    }

    if (!samePoint(out[out.length - 1],routePoint)) {
        out.push({x:routePoint.x,y:routePoint.y});
    }

    return out;
}

function removeConsecutiveDuplicatePoints(points) {
    return points.filter(
        (point,index) =>
            index === 0 ||
            !samePoint(points[index - 1],point)
    );
}

function pointFromObject(obj, svg) {

    if (!obj) return null;

    let x = null;
    let y = null;

    if (
        Number.isFinite(obj.x) &&
        Number.isFinite(obj.y)
    ) {
        x = obj.x;
        y = obj.y;
    }
    else if (
        obj.point &&
        Number.isFinite(obj.point.x) &&
        Number.isFinite(obj.point.y)
    ) {
        x = obj.point.x;
        y = obj.point.y;
    }
    else if (
        Number.isFinite(obj.cx) &&
        Number.isFinite(obj.cy)
    ) {
        x = obj.cx;
        y = obj.cy;
    }

    if (x === null || y === null) {
        return null;
    }

    if (
        svg &&
        typeof svg.getScreenCTM === 'function'
    ) {

        const m = svg.getScreenCTM();

        if (m) {

            const p = new DOMPoint(x,y)
                .matrixTransform(m);

            return {
                x: p.x,
                y: p.y
            };
        }
    }

    return {x,y};
}

export async function routeTechRibWires({
    components,
    wires,
    snapshot = {},
    wasmUrl = WASM_URL
} = {}) {

    if (!components || !wires) {
        throw new Error('components e wires são obrigatórios');
    }

    await AvoidLib.load(wasmUrl);

    const Avoid = AvoidLib.getInstance();

    const ORTHOGONAL = 2;

    const DIR = {
        top:1,
        bottom:2,
        left:4,
        right:8,
        all:15
    };

    const router =
        new Avoid.Router(ORTHOGONAL);

    router.setRoutingParameter(
        Avoid.segmentPenalty,
        25
    );

    router.setRoutingParameter(
        Avoid.shapeBufferDistance,
        8
    );

    router.setRoutingParameter(
        Avoid.idealNudgingDistance,
        6
    );

    router.setRoutingParameter(
        Avoid.portDirectionPenalty,
        100
    );

    router.setRoutingOption(
        Avoid.nudgeOrthogonalSegmentsConnectedToShapes,
        true
    );

    router.setRoutingOption(
        Avoid.nudgeOrthogonalTouchingColinearSegments,
        true
    );

    router.setRoutingOption(
        Avoid.performUnifyingNudgingPreprocessingStep,
        false
    );

    router.setRoutingOption(
        Avoid.nudgeSharedPathsWithCommonEndPoint,
        true
    );

    const shapeRefs = [];
    const pins = [];
    const conns = [];

    const componentMap = new Map();
    const terminalMap = new Map();

    let nextPinId = 100;

    for (const component of components) {

        const componentId =
            component.dataset.componentId;

        const type =
            component.dataset.type ||
            component.dataset.component ||
            '';

        const r = rectOf(component);

        if (!r) continue;

        const rectangle =
            new Avoid.Rectangle(
                new Avoid.Point(r.left,r.top),
                new Avoid.Point(r.right,r.bottom)
            );

        const shapeRef =
            new Avoid.ShapeRef(
                router,
                rectangle
            );

        shapeRefs.push(shapeRef);

        const info = {
            id:componentId,
            type,
            el:component,
            rect:r,
            shapeRef
        };

        componentMap.set(
            componentId,
            info
        );

        const terminals =
            component.querySelectorAll(
                '[data-terminal]'
            );

        for (const terminalEl of terminals) {

            const terminal =
                terminalEl.dataset.terminal;

            const tr =
                rectOf(terminalEl);

            if (!tr) continue;

            const center =
                centerRect(tr);

            const side =
                semanticSide(
                    type,
                    terminal,
                    terminalEl.dataset.wireSide ||
                    terminalEl.dataset.side ||
                    terminalEl.dataset.direction
                ) ||
                geometricSide(r,tr);

            // O borne SVG real normalmente fica alguns pixels
            // dentro do corpo do componente.
            //
            // O Libavoid recebe um PORT GATE projetado
            // exatamente na borda física do obstáculo.
            let gateX = center.x;
            let gateY = center.y;

            if (side === 'top') {
                gateY = r.top;
            }
            else if (side === 'bottom') {
                gateY = r.bottom;
            }
            else if (side === 'left') {
                gateX = r.left;
            }
            else if (side === 'right') {
                gateX = r.right;
            }

            const xRatio =
                clamp(
                    (gateX - r.left) /
                    Math.max(r.width,1),
                    0,
                    1
                );

            const yRatio =
                clamp(
                    (gateY - r.top) /
                    Math.max(r.height,1),
                    0,
                    1
                );

            const classId =
                nextPinId++;

            const pin =
                new Avoid.ShapeConnectionPin(
                    shapeRef,
                    classId,
                    xRatio,
                    yRatio,
                    true,
                    0,
                    DIR[side] || DIR.all
                );

            pins.push(pin);

            terminalMap.set(
                `${componentId}::${terminal}`,
                {
                    componentId,
                    terminal,
                    terminalEl,
                    rect:tr,
                    side,
                    classId,
                    shapeRef,

                    // Centro verdadeiro do borne TechRib.
                    terminalPoint:{
                        x:center.x,
                        y:center.y
                    },

                    // Ponto de entrada/saida usado pelo Libavoid.
                    gatePoint:{
                        x:gateX,
                        y:gateY
                    }
                }
            );
        }
    }

    const junctionSnapshot =
        Array.isArray(snapshot?.junctions)
            ? snapshot.junctions
            : [];

    const junctionMap =
        new Map();

    const junctionRefs =
        new Map();

    const junctionPoints =
        new Map();

    const junctionSvg =
        wires.find(
            wire => wire?.path?.ownerSVGElement
        )?.path?.ownerSVGElement ||
        null;

    for (
        let i=0;
        i<junctionSnapshot.length;
        i++
    ) {

        const j =
            junctionSnapshot[i];

        const id =
            j?.id ||
            j?.junctionId ||
            j?.name ||
            `JUNCTION_${i}`;

        junctionMap.set(
            String(id),
            j
        );

        const point =
            pointFromObject(
                j,
                junctionSvg
            );

        if (!point) continue;

        const junctionRef =
            new Avoid.JunctionRef(
                router,
                new Avoid.Point(
                    point.x,
                    point.y
                ),
                1000000 + i
            );

        if (
            typeof junctionRef
                .setPositionFixed === 'function'
        ) {
            junctionRef.setPositionFixed(true);
        }

        junctionRefs.set(
            String(id),
            junctionRef
        );

        junctionPoints.set(
            String(id),
            point
        );
    }

    function connEndFromJunctionRef(
        junctionRef
    ) {

        // No binding 0.3.1 a factory e um metodo de
        // instancia que transforma o proprio ConnEnd.
        const connEnd =
            new Avoid.ConnEnd(
                new Avoid.Point(0,0)
            );

        return connEnd
            .createConnEndFromJunctionRef(
                junctionRef
            );
    }

    // A contagem e a resolucao usam a mesma identidade fisica.
    // Junctions TechRib nao possuem entrada em terminalMap.
    function physicalPinInfo(wire, which) {
        const ep = wire?.[which];
        const componentId =
            ep?.el?.closest?.('.placed-component')
                ?.dataset?.componentId ||
            wire?.[`${which}Component`];
        const terminal =
            ep?.el?.dataset?.terminal ||
            wire?.[`${which}Terminal`];

        return componentId && terminal
            ? terminalMap.get(`${componentId}::${terminal}`)
            : null;
    }

    const terminalUsage = new Map();
    const autoTerminalJunctions = new Map();
    const auxiliaryJobs = [];

    for (const wire of wires) {
        for (const which of ['from','to']) {
            const pinInfo = physicalPinInfo(wire,which);
            if (!pinInfo) continue;

            const key = `${pinInfo.componentId}::${pinInfo.terminal}`;
            const usage = terminalUsage.get(key);
            if (usage) {
                usage.count++;
            } else {
                terminalUsage.set(key,{count:1,pinInfo,wire});
            }
        }
    }

    const branchDistance = 16;
    const outward = {
        top:{x:0,y:-1},
        bottom:{x:0,y:1},
        left:{x:-1,y:0},
        right:{x:1,y:0}
    };
    let nextAutoJunctionId = 1000000 + junctionSnapshot.length;

    // Todas as juncoes sao criadas antes dos conectores, para
    // nao colidir com os IDs automaticos alocados pelo Libavoid.
    for (const [key,usage] of terminalUsage) {
        if (usage.count <= 1) continue;

        const {pinInfo} = usage;
        const direction = outward[pinInfo.side];
        if (!direction) {
            throw new Error(`Lado do borne compartilhado invalido: ${key}`);
        }
        const point = {
            x:pinInfo.gatePoint.x + direction.x * branchDistance,
            y:pinInfo.gatePoint.y + direction.y * branchDistance
        };
        const ref = new Avoid.JunctionRef(
            router,
            new Avoid.Point(point.x,point.y),
            nextAutoJunctionId++
        );
        ref.setPositionFixed(true);
        autoTerminalJunctions.set(key,{
            id:`AUTO_JUNCTION::${key}`,
            ref,
            point
        });
    }

    for (const [key,branch] of autoTerminalJunctions) {
        const {pinInfo,wire} = terminalUsage.get(key);
        const from = {
            kind:'pin',
            componentId:pinInfo.componentId,
            terminal:pinInfo.terminal,
            terminalPoint:pinInfo.terminalPoint,
            gatePoint:pinInfo.gatePoint,
            point:pinInfo.gatePoint,
            side:pinInfo.side,
            connEnd:new Avoid.ConnEnd(pinInfo.shapeRef,pinInfo.classId)
        };
        const to = {
            kind:'auto-junction',
            junctionId:branch.id,
            point:branch.point,
            connEnd:connEndFromJunctionRef(branch.ref)
        };
        const conn = new Avoid.ConnRef(router,from.connEnd,to.connEnd);
        conn.setRoutingType(ORTHOGONAL);
        conn.setHateCrossings(false);
        conns.push(conn);
        auxiliaryJobs.push({
            wire,from,to,conn,auxiliary:true,terminalKey:key
        });
    }

    function resolveEndpoint(
        wire,
        which
    ) {

        const ep = wire?.[which];

        const explicitComponent =
            wire?.[`${which}Component`] ||
            null;

        const explicitTerminal =
            wire?.[`${which}Terminal`] ||
            null;

        const pinInfo = physicalPinInfo(wire,which);

        if (pinInfo) {
                const {componentId,terminal} = pinInfo;
                const key = `${componentId}::${terminal}`;
                const branch = autoTerminalJunctions.get(key);

                if (branch) {
                    return {
                        kind:'auto-junction',
                        componentId,
                        terminal,
                        junctionId:branch.id,
                        gatePoint:pinInfo.gatePoint,
                        side:pinInfo.side,
                        point:branch.point,
                        // O trecho ate o borne pertence somente ao auxiliar.
                        connEnd:connEndFromJunctionRef(branch.ref)
                    };
                }

                return {
                    kind:'pin',
                    componentId,
                    terminal,

                    terminalPoint:
                        pinInfo.terminalPoint,

                    gatePoint:
                        pinInfo.gatePoint,

                    point:
                        pinInfo.gatePoint,

                    side:
                        pinInfo.side,

                    connEnd:
                        new Avoid.ConnEnd(
                            pinInfo.shapeRef,
                            pinInfo.classId
                        )
                };
        }

        const candidateIds = [
            ep?.junctionId,
            ep?.id,
            explicitTerminal,
            explicitComponent
        ]
        .filter(Boolean)
        .map(String);

        for (const id of candidateIds) {

            const junctionRef =
                junctionRefs.get(id);

            if (!junctionRef) continue;

            return {
                kind:'junction',
                junctionId:id,
                point:
                    junctionPoints.get(id),
                connEnd:
                    connEndFromJunctionRef(
                        junctionRef
                    )
            };
        }

        if (
            ep?.el &&
            ep.el.getBoundingClientRect
        ) {

            const r =
                rectOf(ep.el);

            if (r) {

                const p =
                    centerRect(r);

                return {
                    kind:'point-dom',
                    componentId:null,
                    terminal:
                        ep.el.dataset?.terminal ||
                        null,
                    point:p,
                    connEnd:
                        new Avoid.ConnEnd(
                            new Avoid.Point(
                                p.x,
                                p.y
                            )
                        )
                };
            }
        }

        const svg =
            wire?.path?.ownerSVGElement ||
            null;

        const directPoint =
            pointFromObject(
                ep,
                svg
            );

        if (directPoint) {

            return {
                kind:'point-data',
                point:directPoint,
                connEnd:
                    new Avoid.ConnEnd(
                        new Avoid.Point(
                            directPoint.x,
                            directPoint.y
                        )
                    )
            };
        }

        return null;
    }

    const endpointFailures = [];
    const routeJobs = [];

    for (const wire of wires) {

        const from =
            resolveEndpoint(
                wire,
                'from'
            );

        const to =
            resolveEndpoint(
                wire,
                'to'
            );

        if (!from || !to) {

            endpointFailures.push({
                wireId:
                    wire.id ||
                    wire.number ||
                    null,
                fromResolved:!!from,
                toResolved:!!to,
                fromComponent:
                    wire.fromComponent ||
                    null,
                fromTerminal:
                    wire.fromTerminal ||
                    null,
                toComponent:
                    wire.toComponent ||
                    null,
                toTerminal:
                    wire.toTerminal ||
                    null
            });

            continue;
        }

        const conn =
            new Avoid.ConnRef(
                router,
                from.connEnd,
                to.connEnd
            );

        conn.setRoutingType(
            ORTHOGONAL
        );

        conn.setHateCrossings(
            false
        );

        conns.push(conn);

        routeJobs.push({
            wire,
            from,
            to,
            conn
        });
    }

    router.processTransaction();

    const routes = [];
    const auxiliaryRoutes = [];

    for (const job of [...routeJobs,...auxiliaryJobs]) {

        const corePoints =
            routePoints(
                job.conn.displayRoute()
            );

        // FULL PATH:
        //
        // borne real TechRib
        //      ->
        // port gate na borda
        //      ->
        // rota Libavoid
        //      ->
        // port gate destino
        //      ->
        // borne real destino
        //
        // O pequeno trecho dentro do componente continua
        // ortogonal e pertence somente ao próprio borne.

        let points =
            removeConsecutiveDuplicatePoints(corePoints);

        if (
            job.from.terminalPoint &&
            points.length
        ) {
            const p = job.from.terminalPoint;
            const bridge = orthogonalBridge(
                p,
                points[0],
                job.from.side
            );

            points = removeConsecutiveDuplicatePoints([
                ...bridge.slice(0,-1),
                ...points
            ]);
        }

        if (
            job.to.terminalPoint &&
            points.length
        ) {
            const p =
                job.to.terminalPoint;
            const bridge = orthogonalBridge(
                p,
                points[points.length - 1],
                job.to.side
            ).reverse();

            points = removeConsecutiveDuplicatePoints([
                ...points,
                ...bridge.slice(1)
            ]);
        }

        const destinationRoutes = job.auxiliary
            ? auxiliaryRoutes
            : routes;

        destinationRoutes.push({
            auxiliary:!!job.auxiliary,
            terminalKey:job.terminalKey || null,
            wireId:
                job.wire.id ||
                job.wire.number ||
                null,

            color:
                job.wire.color ||
                '#00bcd4',

            profile:
                job.wire.profile ||
                null,

            gauge:
                job.wire.gauge ||
                null,

            crossSectionMm2:
                job.wire.crossSectionMm2 ||
                null,

            sourceComponent:
                job.from.componentId ||
                null,

            sourceTerminal:
                job.from.terminal ||
                null,

            destinationComponent:
                job.to.componentId ||
                null,

            destinationTerminal:
                job.to.terminal ||
                null,

            sourceSide:
                job.from.side ||
                null,

            destinationSide:
                job.to.side ||
                null,

            sourceGate:
                job.from.gatePoint ||
                null,

            destinationGate:
                job.to.gatePoint ||
                null,

            points
        });
    }

    return {
        totalWires:
            wires.length,

        routedWires:
            routes.length,

        endpointFailures,

        routeConservationOk:
            routes.length +
            endpointFailures.length ===
            wires.length,

        auxiliaryBranchConnectors:
            auxiliaryJobs.length,

        routes,
        auxiliaryRoutes
    };
}
