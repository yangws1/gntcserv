
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const clearJigsaw = writable([null, ]);
    const name = writable("");
    const order = writable("");
    const sanctuary = writable("");
    const clearCMind = writable(0);
    const varypuzzlecount = writable(0);

    /* src\Timer.svelte generated by Svelte v3.32.1 */

    const file = "src\\Timer.svelte";

    function create_fragment(ctx) {
    	let b;
    	let t0_value = parseInt(/*second*/ ctx[0] / 60) + "";
    	let t0;
    	let t1;
    	let t2_value = /*second*/ ctx[0] % 60 + "";
    	let t2;

    	const block = {
    		c: function create() {
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = text(" : ");
    			t2 = text(t2_value);
    			add_location(b, file, 4, 0, 47);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, b, anchor);
    			append_dev(b, t0);
    			append_dev(b, t1);
    			append_dev(b, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*second*/ 1 && t0_value !== (t0_value = parseInt(/*second*/ ctx[0] / 60) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*second*/ 1 && t2_value !== (t2_value = /*second*/ ctx[0] % 60 + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(b);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Timer", slots, []);
    	let { second } = $$props;
    	const writable_props = ["second"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("second" in $$props) $$invalidate(0, second = $$props.second);
    	};

    	$$self.$capture_state = () => ({ second });

    	$$self.$inject_state = $$props => {
    		if ("second" in $$props) $$invalidate(0, second = $$props.second);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [second];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { second: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*second*/ ctx[0] === undefined && !("second" in props)) {
    			console.warn("<Timer> was created without expected prop 'second'");
    		}
    	}

    	get second() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set second(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Jigsaw.svelte generated by Svelte v3.32.1 */

    const { Error: Error_1, Object: Object_1, document: document_1 } = globals;
    const file$1 = "src\\Jigsaw.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (150:0) {:catch error}
    function create_catch_block(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[21] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("Error occured - ");
    			t1 = text(t1_value);
    			add_location(p, file$1, 151, 4, 3782);
    			add_location(div, file$1, 150, 0, 3771);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(150:0) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (117:0) {:then data}
    function create_then_block(ctx) {
    	let div4;
    	let h3;
    	let t0_value = /*data*/ ctx[6].gameName + "";
    	let t0;
    	let t1;
    	let hr0;
    	let t2;
    	let p;
    	let t3_value = /*data*/ ctx[6].gameDesc + "";
    	let t3;
    	let t4;
    	let div0;
    	let t5;
    	let div1;
    	let t6;
    	let div3;
    	let hr1;
    	let br;
    	let t7;
    	let div2;
    	let t8;
    	let each_value_1 = /*data*/ ctx[6].tabs;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*data*/ ctx[6][/*getTabId*/ ctx[5]()];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div3 = element("div");
    			hr1 = element("hr");
    			br = element("br");
    			t7 = space();
    			div2 = element("div");
    			t8 = text(/*endDescription*/ ctx[2]);
    			add_location(h3, file$1, 118, 4, 2990);
    			attr_dev(hr0, "class", "hair-line");
    			add_location(hr0, file$1, 119, 4, 3020);
    			add_location(p, file$1, 120, 4, 3049);
    			attr_dev(div0, "class", "tabs svelte-982ddw");
    			add_location(div0, file$1, 123, 4, 3093);
    			attr_dev(div1, "class", "tab-items svelte-982ddw");
    			add_location(div1, file$1, 132, 4, 3344);
    			attr_dev(hr1, "class", "hair-line");
    			add_location(hr1, file$1, 140, 8, 3630);
    			add_location(br, file$1, 140, 31, 3653);
    			add_location(div2, file$1, 142, 8, 3678);
    			add_location(div3, file$1, 139, 4, 3615);
    			add_location(div4, file$1, 117, 0, 2979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h3);
    			append_dev(h3, t0);
    			append_dev(div4, t1);
    			append_dev(div4, hr0);
    			append_dev(div4, t2);
    			append_dev(div4, p);
    			append_dev(p, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div4, t5);
    			append_dev(div4, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, hr1);
    			append_dev(div3, br);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tabId, gameContent*/ 258) {
    				each_value_1 = /*data*/ ctx[6].tabs;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*timeout, solved, gameId, loadGame, gameContent, getTabId*/ 441) {
    				each_value = /*data*/ ctx[6][/*getTabId*/ ctx[5]()];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*endDescription*/ 4) set_data_dev(t8, /*endDescription*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(117:0) {:then data}",
    		ctx
    	});

    	return block;
    }

    // (126:12) {#if i > 0}
    function create_if_block(ctx) {
    	let button;
    	let t0_value = /*tab*/ ctx[19] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[9](/*i*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "pretty-grey svelte-982ddw");
    			add_location(button, file$1, 126, 12, 3187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(126:12) {#if i > 0}",
    		ctx
    	});

    	return block;
    }

    // (125:8) {#each data.tabs as tab, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[18] > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*i*/ ctx[18] > 0) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(125:8) {#each data.tabs as tab, i}",
    		ctx
    	});

    	return block;
    }

    // (134:8) {#each data[getTabId()] as item, i}
    function create_each_block(ctx) {
    	let button;
    	let t0_value = /*item*/ ctx[16] + "";
    	let t0;
    	let t1;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[10](/*i*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "pretty svelte-982ddw");
    			button.disabled = button_disabled_value = /*timeout*/ ctx[0] | /*solved*/ ctx[4][/*i*/ ctx[18] + 1];
    			add_location(button, file$1, 134, 12, 3426);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*getTabId*/ 32 && t0_value !== (t0_value = /*item*/ ctx[16] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*timeout, solved*/ 17 && button_disabled_value !== (button_disabled_value = /*timeout*/ ctx[0] | /*solved*/ ctx[4][/*i*/ ctx[18] + 1])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(134:8) {#each data[getTabId()] as item, i}",
    		ctx
    	});

    	return block;
    }

    // (112:20)   <div>      <p>로딩중... 잠시만 기다려 주세요!</p>  </div>    {:then data}
    function create_pending_block(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "로딩중... 잠시만 기다려 주세요!";
    			add_location(p, file$1, 113, 4, 2927);
    			add_location(div, file$1, 112, 0, 2916);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(112:20)   <div>      <p>로딩중... 잠시만 기다려 주세요!</p>  </div>    {:then data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let link;
    	let t0;
    	let t1;
    	let div;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 6,
    		error: 21
    	};

    	handle_promise(/*gameContent*/ ctx[8], info);

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			link = element("link");
    			t0 = space();
    			info.block.c();
    			t1 = space();
    			div = element("div");
    			if (script0.src !== (script0_src_value = "https://cdn.polyfill.io/v2/polyfill.min.js?features=default")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$1, 106, 4, 2691);
    			if (script1.src !== (script1_src_value = "./data/puzzle.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$1, 107, 4, 2780);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "./data/puzzle.css");
    			add_location(link, file$1, 108, 4, 2826);
    			attr_dev(div, "id", "game-puzzle");
    			attr_dev(div, "class", "pop svelte-982ddw");
    			add_location(div, file$1, 157, 0, 3850);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script0);
    			append_dev(document_1.head, script1);
    			append_dev(document_1.head, link);
    			insert_dev(target, t0, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t1.parentNode;
    			info.anchor = t1;
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[6] = child_ctx[21] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let getTabId;
    	let $clearJigsaw;
    	validate_store(clearJigsaw, "clearJigsaw");
    	component_subscribe($$self, clearJigsaw, $$value => $$invalidate(12, $clearJigsaw = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Jigsaw", slots, []);
    	let { timeout = true } = $$props;
    	let data;
    	let endDescription = "";
    	let gameId;
    	let tabId;
    	let solved = [];
    	let onplay = false;

    	//로딩
    	/*
    ===game-Object=== 
    {
        gameName, //게임명
        gameDesc, //게임설명
        content  //게임설정
        ex)
        [
            null,
            {
                descEnd: 게임 후 설명; [필요시] /text

                ---오디오 퍼즐인 경우---
                audio: ["audio/path/1.mp3", ...];

                ---영상 퍼즐인 경우---
                video: {path: "path/to/video.mp4", codec: "코덱"}

                ---직소퍼즐일 경우--
                image: "path/to/img.jpg"

                ---직소퍼즐을 제외하고---
                answer: "text"

                ---악보보고 찬송가 맞추기 퍼즐---
                images: ["path/to/img1", ...]
            }
        ]
        // 추가 tabs = [] / tabId[:id] = []
    };
    */
    	async function getData() {
    		// 게임 데이터 불러오기
    		const res = await fetch("./data/jigsaw.json");

    		$$invalidate(6, data = await res.json());

    		if (res.ok) {
    			tabGenerator();
    			return data;
    		} else throw new Error(data);
    	}

    	function tabGenerator() {
    		$$invalidate(6, data.tabCount = 0, data);
    		$$invalidate(6, data.tabs = [null], data);

    		for (var i = 1; i < data.content.length; i++) {
    			if (i % 10 == 1) {
    				$$invalidate(6, data.tabCount++, data);
    				$$invalidate(6, data.tabs[data.tabCount] = `${i}-${i + 9}번 문제`, data);
    				$$invalidate(6, data[`tabId${data.tabCount}`] = [], data);
    			}

    			data[`tabId${data.tabCount}`].push(`문제 ${i}번`);
    		}

    		$$invalidate(1, tabId = 1);
    	}

    	function loadGame() {
    		onplay = true;
    		$$invalidate(2, endDescription = "");
    		const element = document.querySelector("#game-puzzle");

    		element.pz = new Puzzle({
    				el: element,
    				image: data.content[gameId].image,
    				difficulty: "expert",
    				numrows: 5,
    				numcolumns: 5,
    				finished(evt) {
    					endGame(evt);
    				}
    			}).init();
    	}

    	function endGame(evt) {
    		setTimeout(
    			(function () {
    				onplay = false;
    				Object.assign(evt.self.fullImg.style, { "opacity": 1, "z-index": 1 });
    			}).bind(evt),
    			300
    		);

    		set_store_value(clearJigsaw, $clearJigsaw = [...$clearJigsaw, gameId], $clearJigsaw);
    		$$invalidate(2, endDescription = data.content[gameId].descEnd);
    		$$invalidate(4, solved[gameId] = true, solved);
    	}

    	let gameContent = getData();
    	const writable_props = ["timeout"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jigsaw> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => $$invalidate(1, tabId = i);

    	const click_handler_1 = i => {
    		$$invalidate(3, gameId = i + 1);
    		loadGame();
    	};

    	$$self.$$set = $$props => {
    		if ("timeout" in $$props) $$invalidate(0, timeout = $$props.timeout);
    	};

    	$$self.$capture_state = () => ({
    		clearJigsaw,
    		timeout,
    		data,
    		endDescription,
    		gameId,
    		tabId,
    		solved,
    		onplay,
    		getData,
    		tabGenerator,
    		loadGame,
    		endGame,
    		gameContent,
    		getTabId,
    		$clearJigsaw
    	});

    	$$self.$inject_state = $$props => {
    		if ("timeout" in $$props) $$invalidate(0, timeout = $$props.timeout);
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("endDescription" in $$props) $$invalidate(2, endDescription = $$props.endDescription);
    		if ("gameId" in $$props) $$invalidate(3, gameId = $$props.gameId);
    		if ("tabId" in $$props) $$invalidate(1, tabId = $$props.tabId);
    		if ("solved" in $$props) $$invalidate(4, solved = $$props.solved);
    		if ("onplay" in $$props) onplay = $$props.onplay;
    		if ("gameContent" in $$props) $$invalidate(8, gameContent = $$props.gameContent);
    		if ("getTabId" in $$props) $$invalidate(5, getTabId = $$props.getTabId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tabId*/ 2) {
    			 $$invalidate(5, getTabId = () => `tabId${tabId}`);
    		}
    	};

    	return [
    		timeout,
    		tabId,
    		endDescription,
    		gameId,
    		solved,
    		getTabId,
    		data,
    		loadGame,
    		gameContent,
    		click_handler,
    		click_handler_1
    	];
    }

    class Jigsaw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { timeout: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jigsaw",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get timeout() {
    		throw new Error_1("<Jigsaw>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeout(value) {
    		throw new Error_1("<Jigsaw>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Login.svelte generated by Svelte v3.32.1 */
    const file$2 = "src\\Login.svelte";

    function create_fragment$2(ctx) {
    	let div4;
    	let div0;
    	let span0;
    	let br0;
    	let t1;
    	let input0;
    	let br1;
    	let br2;
    	let t2;
    	let div1;
    	let span1;
    	let br3;
    	let t4;
    	let input1;
    	let br4;
    	let br5;
    	let t5;
    	let div2;
    	let span2;
    	let br6;
    	let t7;
    	let input2;
    	let br7;
    	let br8;
    	let t8;
    	let div3;
    	let span3;
    	let br9;
    	let t10;
    	let input3;
    	let br10;
    	let br11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "성전: ";
    			br0 = element("br");
    			t1 = space();
    			input0 = element("input");
    			br1 = element("br");
    			br2 = element("br");
    			t2 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "기수: ";
    			br3 = element("br");
    			t4 = space();
    			input1 = element("input");
    			br4 = element("br");
    			br5 = element("br");
    			t5 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "이름: ";
    			br6 = element("br");
    			t7 = space();
    			input2 = element("input");
    			br7 = element("br");
    			br8 = element("br");
    			t8 = space();
    			div3 = element("div");
    			span3 = element("span");
    			span3.textContent = "회장단 코드:";
    			br9 = element("br");
    			t10 = space();
    			input3 = element("input");
    			br10 = element("br");
    			br11 = element("br");
    			attr_dev(span0, "class", "t svelte-hslhng");
    			add_location(span0, file$2, 5, 19, 131);
    			add_location(br0, file$2, 5, 50, 162);
    			attr_dev(div0, "class", "u svelte-hslhng");
    			add_location(div0, file$2, 5, 4, 116);
    			attr_dev(input0, "class", " svelte-hslhng");
    			add_location(input0, file$2, 6, 4, 179);
    			add_location(br1, file$2, 6, 40, 215);
    			add_location(br2, file$2, 6, 45, 220);
    			attr_dev(span1, "class", "t svelte-hslhng");
    			add_location(span1, file$2, 7, 19, 246);
    			add_location(br3, file$2, 7, 50, 277);
    			attr_dev(div1, "class", "u svelte-hslhng");
    			add_location(div1, file$2, 7, 4, 231);
    			attr_dev(input1, "class", " svelte-hslhng");
    			add_location(input1, file$2, 8, 4, 294);
    			add_location(br4, file$2, 8, 41, 331);
    			add_location(br5, file$2, 8, 46, 336);
    			attr_dev(span2, "class", "t svelte-hslhng");
    			add_location(span2, file$2, 9, 19, 362);
    			add_location(br6, file$2, 9, 50, 393);
    			attr_dev(div2, "class", "u svelte-hslhng");
    			add_location(div2, file$2, 9, 4, 347);
    			attr_dev(input2, "class", " svelte-hslhng");
    			add_location(input2, file$2, 10, 4, 410);
    			add_location(br7, file$2, 10, 45, 451);
    			add_location(br8, file$2, 10, 50, 456);
    			attr_dev(span3, "class", "t svelte-hslhng");
    			add_location(span3, file$2, 11, 19, 482);
    			add_location(br9, file$2, 11, 49, 512);
    			attr_dev(div3, "class", "u svelte-hslhng");
    			add_location(div3, file$2, 11, 4, 467);
    			attr_dev(input3, "class", " svelte-hslhng");
    			add_location(input3, file$2, 12, 4, 529);
    			add_location(br10, file$2, 12, 45, 570);
    			add_location(br11, file$2, 12, 50, 575);
    			add_location(div4, file$2, 4, 0, 105);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, span0);
    			append_dev(div0, br0);
    			append_dev(div4, t1);
    			append_dev(div4, input0);
    			set_input_value(input0, /*$name*/ ctx[1]);
    			append_dev(div4, br1);
    			append_dev(div4, br2);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, span1);
    			append_dev(div1, br3);
    			append_dev(div4, t4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*$order*/ ctx[2]);
    			append_dev(div4, br4);
    			append_dev(div4, br5);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, span2);
    			append_dev(div2, br6);
    			append_dev(div4, t7);
    			append_dev(div4, input2);
    			set_input_value(input2, /*$sanctuary*/ ctx[3]);
    			append_dev(div4, br7);
    			append_dev(div4, br8);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, span3);
    			append_dev(div3, br9);
    			append_dev(div4, t10);
    			append_dev(div4, input3);
    			set_input_value(input3, /*secretcode*/ ctx[0]);
    			append_dev(div4, br10);
    			append_dev(div4, br11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$name*/ 2 && input0.value !== /*$name*/ ctx[1]) {
    				set_input_value(input0, /*$name*/ ctx[1]);
    			}

    			if (dirty & /*$order*/ 4 && input1.value !== /*$order*/ ctx[2]) {
    				set_input_value(input1, /*$order*/ ctx[2]);
    			}

    			if (dirty & /*$sanctuary*/ 8 && input2.value !== /*$sanctuary*/ ctx[3]) {
    				set_input_value(input2, /*$sanctuary*/ ctx[3]);
    			}

    			if (dirty & /*secretcode*/ 1 && input3.value !== /*secretcode*/ ctx[0]) {
    				set_input_value(input3, /*secretcode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $name;
    	let $order;
    	let $sanctuary;
    	validate_store(name, "name");
    	component_subscribe($$self, name, $$value => $$invalidate(1, $name = $$value));
    	validate_store(order, "order");
    	component_subscribe($$self, order, $$value => $$invalidate(2, $order = $$value));
    	validate_store(sanctuary, "sanctuary");
    	component_subscribe($$self, sanctuary, $$value => $$invalidate(3, $sanctuary = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	let { secretcode } = $$props;
    	const writable_props = ["secretcode"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$name = this.value;
    		name.set($name);
    	}

    	function input1_input_handler() {
    		$order = this.value;
    		order.set($order);
    	}

    	function input2_input_handler() {
    		$sanctuary = this.value;
    		sanctuary.set($sanctuary);
    	}

    	function input3_input_handler() {
    		secretcode = this.value;
    		$$invalidate(0, secretcode);
    	}

    	$$self.$$set = $$props => {
    		if ("secretcode" in $$props) $$invalidate(0, secretcode = $$props.secretcode);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		order,
    		sanctuary,
    		secretcode,
    		$name,
    		$order,
    		$sanctuary
    	});

    	$$self.$inject_state = $$props => {
    		if ("secretcode" in $$props) $$invalidate(0, secretcode = $$props.secretcode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		secretcode,
    		$name,
    		$order,
    		$sanctuary,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { secretcode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*secretcode*/ ctx[0] === undefined && !("secretcode" in props)) {
    			console.warn("<Login> was created without expected prop 'secretcode'");
    		}
    	}

    	get secretcode() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secretcode(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Catchmind.svelte generated by Svelte v3.32.1 */
    const file$3 = "src\\Catchmind.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let p;
    	let t1;
    	let hr;
    	let t2;
    	let div1;
    	let t3;
    	let t4;
    	let br0;
    	let t5;
    	let input;
    	let t6;
    	let button;
    	let t7;
    	let button_disabled_value;
    	let t8;
    	let br1;
    	let t9;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Zoom 소회의실에서 화이트보드 기능을 이용하여 제시어로 캐치마인드 게임을 진행하시면 됩니다. \r\n        캐치마인드 정답이 나왔을 때, 정답이 나온 채팅창과 Zoom 화면을 캡처하여 청년수련회 플러스친구로 보내주시면 코드를 회신해 드립니다.\r\n        정답자에게 정답 코드를 귓속말로 전달하고, 정답자는 화이트보드 기능을 활용하여 캐치마인드 게임을 이어나가시면 됩니다.";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			div1 = element("div");
    			t3 = text("제시어: ");
    			t4 = text(/*quiz*/ ctx[2]);
    			br0 = element("br");
    			t5 = text("\r\n        정답 코드: ");
    			input = element("input");
    			t6 = space();
    			button = element("button");
    			t7 = text("제시어 확인하기");
    			t8 = space();
    			br1 = element("br");
    			t9 = text(/*showData*/ ctx[3]);
    			add_location(p, file$3, 72, 8, 1587);
    			set_style(div0, "padding", "15px");
    			add_location(div0, file$3, 71, 4, 1549);
    			attr_dev(hr, "class", "hair-line");
    			add_location(hr, file$3, 78, 4, 1845);
    			add_location(br0, file$3, 80, 19, 1899);
    			add_location(input, file$3, 81, 15, 1921);
    			button.disabled = button_disabled_value = /*timeout*/ ctx[0] | /*end*/ ctx[4];
    			attr_dev(button, "class", "pretty svelte-1qponus");
    			add_location(button, file$3, 82, 8, 1958);
    			add_location(br1, file$3, 83, 8, 2053);
    			add_location(div1, file$3, 79, 4, 1873);
    			add_location(div2, file$3, 70, 0, 1538);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(div2, t1);
    			append_dev(div2, hr);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, br0);
    			append_dev(div1, t5);
    			append_dev(div1, input);
    			set_input_value(input, /*code*/ ctx[1]);
    			append_dev(div1, t6);
    			append_dev(div1, button);
    			append_dev(button, t7);
    			append_dev(div1, t8);
    			append_dev(div1, br1);
    			append_dev(div1, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(button, "click", /*showNext*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*quiz*/ 4) set_data_dev(t4, /*quiz*/ ctx[2]);

    			if (dirty & /*code*/ 2 && input.value !== /*code*/ ctx[1]) {
    				set_input_value(input, /*code*/ ctx[1]);
    			}

    			if (dirty & /*timeout*/ 1 && button_disabled_value !== (button_disabled_value = /*timeout*/ ctx[0] | /*end*/ ctx[4])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*showData*/ 8) set_data_dev(t9, /*showData*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $clearCMind;
    	validate_store(clearCMind, "clearCMind");
    	component_subscribe($$self, clearCMind, $$value => $$invalidate(8, $clearCMind = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Catchmind", slots, []);
    	let { timeout } = $$props;
    	let { codeManager } = $$props;
    	let code;
    	let quiz = "";
    	let end = false;
    	let showData = "";

    	let o = {
    		a1536a: "송아지",
    		b8387b: "감언이설",
    		c2317c: "보면대",
    		d7616d: "모세",
    		e4548e: "햄스터",
    		f4632f: "오매불망",
    		g1896g: "성미",
    		h1386h: "요나",
    		i6054i: "도롱뇽",
    		j3576j: "고군분투",
    		a9035a: "청년봉사선교회",
    		b2088b: "삭개오",
    		c4312c: "아나콘다",
    		d2662d: "거두절미",
    		e6375e: "성가대",
    		f9387f: "솔로몬",
    		g1038g: "흰수염고래",
    		h2688h: "결초보은",
    		i5653i: "대표기도",
    		j5312j: "스가랴",
    		j7012j: "재규어",
    		a6863a: "대서특필",
    		b4386b: "주중예배",
    		c1245c: "골리앗",
    		d6563d: "두루미",
    		e1382e: "삼삼오오",
    		f3486f: "만나실",
    		g1257g: "다니엘",
    		h4052h: "황제펭귄",
    		i1238i: "경거망동",
    		j8702j: "교회학교",
    		a5073a: "마리아",
    		b2027b: "뻐꾸기",
    		c9654c: "개과천선",
    		d2425d: "목사님",
    		e8612e: "노아",
    		f1219f: "북극곰",
    		g7870g: "격세지감",
    		h1386h: "헌금",
    		i8432i: "지금부터 자유주제!"
    	};

    	function showNext() {
    		let x = o[`${code}`];

    		if (x != null) {
    			$$invalidate(2, quiz = x);
    			$clearCMind.push(quiz);
    		} else {
    			$$invalidate(3, showData = "잘못된 코드입니다.");
    		}
    	}

    	const writable_props = ["timeout", "codeManager"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Catchmind> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		code = this.value;
    		$$invalidate(1, code);
    	}

    	$$self.$$set = $$props => {
    		if ("timeout" in $$props) $$invalidate(0, timeout = $$props.timeout);
    		if ("codeManager" in $$props) $$invalidate(6, codeManager = $$props.codeManager);
    	};

    	$$self.$capture_state = () => ({
    		clearCMind,
    		timeout,
    		codeManager,
    		code,
    		quiz,
    		end,
    		showData,
    		o,
    		showNext,
    		$clearCMind
    	});

    	$$self.$inject_state = $$props => {
    		if ("timeout" in $$props) $$invalidate(0, timeout = $$props.timeout);
    		if ("codeManager" in $$props) $$invalidate(6, codeManager = $$props.codeManager);
    		if ("code" in $$props) $$invalidate(1, code = $$props.code);
    		if ("quiz" in $$props) $$invalidate(2, quiz = $$props.quiz);
    		if ("end" in $$props) $$invalidate(4, end = $$props.end);
    		if ("showData" in $$props) $$invalidate(3, showData = $$props.showData);
    		if ("o" in $$props) o = $$props.o;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*codeManager*/ 64) {
    			 if (codeManager == "베드로153") {
    				$$invalidate(2, quiz = "오병이어");
    			}
    		}
    	};

    	return [timeout, code, quiz, showData, end, showNext, codeManager, input_input_handler];
    }

    class Catchmind extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { timeout: 0, codeManager: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Catchmind",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*timeout*/ ctx[0] === undefined && !("timeout" in props)) {
    			console.warn("<Catchmind> was created without expected prop 'timeout'");
    		}

    		if (/*codeManager*/ ctx[6] === undefined && !("codeManager" in props)) {
    			console.warn("<Catchmind> was created without expected prop 'codeManager'");
    		}
    	}

    	get timeout() {
    		throw new Error("<Catchmind>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeout(value) {
    		throw new Error("<Catchmind>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get codeManager() {
    		throw new Error("<Catchmind>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set codeManager(value) {
    		throw new Error("<Catchmind>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Varypuzzle.svelte generated by Svelte v3.32.1 */
    const file$4 = "src\\Varypuzzle.svelte";

    // (353:8) {:else}
    function create_else_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "문제를 선택해 주세요.";
    			add_location(div, file$4, 353, 12, 16767);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(353:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (328:40) 
    function create_if_block_16(ctx) {
    	let div;
    	let b;
    	let t0_value = parseInt(/*timer2*/ ctx[8].timeLeft / 60) + "";
    	let t0;
    	let t1;
    	let t2_value = /*timer2*/ ctx[8].timeLeft % 60 + "";
    	let t2;
    	let t3;
    	let p_1;
    	let t5;
    	let button;
    	let t6;
    	let button_disabled_value;
    	let t7;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*spdquiz*/ ctx[1].spdstart && create_if_block_17(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = text(" : ");
    			t2 = text(t2_value);
    			t3 = space();
    			p_1 = element("p");
    			p_1.textContent = "한 번 스피드퀴즈를 시작한 뒤에는 다시 도전할 수 없습니다! 준비되었으면 시작해 주세요! 본 퀴즈는 모두 주관식입니다.";
    			t5 = space();
    			button = element("button");
    			t6 = text("스피드퀴즈 시작하기");
    			t7 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(b, file$4, 329, 16, 15514);
    			attr_dev(div, "id", "timer");
    			attr_dev(div, "class", "big");
    			add_location(div, file$4, 328, 12, 15468);
    			add_location(p_1, file$4, 331, 12, 15612);
    			attr_dev(button, "class", "pretty svelte-1wmo1b2");
    			button.disabled = button_disabled_value = /*spdquiz*/ ctx[1].spdstart;
    			add_location(button, file$4, 332, 12, 15699);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, b);
    			append_dev(b, t0);
    			append_dev(b, t1);
    			append_dev(b, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p_1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t6);
    			insert_dev(target, t7, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_17*/ ctx[32], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*timer2*/ 256 && t0_value !== (t0_value = parseInt(/*timer2*/ ctx[8].timeLeft / 60) + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*timer2*/ 256 && t2_value !== (t2_value = /*timer2*/ ctx[8].timeLeft % 60 + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*spdquiz*/ 2 && button_disabled_value !== (button_disabled_value = /*spdquiz*/ ctx[1].spdstart)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (/*spdquiz*/ ctx[1].spdstart) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_17(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p_1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t7);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_16.name,
    		type: "if",
    		source: "(328:40) ",
    		ctx
    	});

    	return block;
    }

    // (294:40) 
    function create_if_block_14(ctx) {
    	let p_1;
    	let t0;
    	let b;
    	let t2;
    	let t3;
    	let div0;
    	let t4;
    	let br0;
    	let t5;
    	let button0;
    	let t6;
    	let button0_disabled_value;
    	let t7;
    	let button1;
    	let t8;
    	let button1_disabled_value;
    	let t9;
    	let button2;
    	let t10;
    	let button2_disabled_value;
    	let t11;
    	let br1;
    	let t12;
    	let hr;
    	let br2;
    	let t13;
    	let div1;
    	let t14;
    	let t15_value = /*object*/ ctx[9][/*object*/ ctx[9].tag] + "";
    	let t15;
    	let br3;
    	let t16;
    	let input;
    	let t17;
    	let button3;
    	let t18;
    	let button3_disabled_value;
    	let t19;
    	let mounted;
    	let dispose;
    	let if_block = /*object*/ ctx[9].end && create_if_block_15(ctx);

    	const block = {
    		c: function create() {
    			p_1 = element("p");
    			t0 = text("주어진 제시어에 해당하는 물건 ");
    			b = element("b");
    			b.textContent = "8 개 이상";
    			t2 = text("을 찾아서 청년수련회 카카오톡 플러스친구 계정으로 보내주시면 코드를 받을 수 있습니다.");
    			t3 = space();
    			div0 = element("div");
    			t4 = text("난이도 선택");
    			br0 = element("br");
    			t5 = space();
    			button0 = element("button");
    			t6 = text("상");
    			t7 = space();
    			button1 = element("button");
    			t8 = text("중");
    			t9 = space();
    			button2 = element("button");
    			t10 = text("하");
    			t11 = space();
    			br1 = element("br");
    			t12 = space();
    			hr = element("hr");
    			br2 = element("br");
    			t13 = space();
    			div1 = element("div");
    			t14 = text("제시어: ");
    			t15 = text(t15_value);
    			br3 = element("br");
    			t16 = text(" \r\n                코드 입력하기: ");
    			input = element("input");
    			t17 = space();
    			button3 = element("button");
    			t18 = text("정답 확인!");
    			t19 = space();
    			if (if_block) if_block.c();
    			add_location(b, file$4, 295, 33, 13706);
    			add_location(p_1, file$4, 294, 12, 13668);
    			add_location(br0, file$4, 298, 22, 13828);
    			attr_dev(button0, "class", "pretty svelte-1wmo1b2");
    			button0.disabled = button0_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9][`clear${/*object*/ ctx[9].tag}`];
    			add_location(button0, file$4, 299, 16, 13851);
    			attr_dev(button1, "class", "pretty svelte-1wmo1b2");
    			button1.disabled = button1_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9][`clear${/*object*/ ctx[9].tag}`];
    			add_location(button1, file$4, 300, 16, 13994);
    			attr_dev(button2, "class", "pretty svelte-1wmo1b2");
    			button2.disabled = button2_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9][`clear${/*object*/ ctx[9].tag}`];
    			add_location(button2, file$4, 301, 16, 14139);
    			add_location(div0, file$4, 297, 12, 13799);
    			add_location(br1, file$4, 303, 12, 14298);
    			attr_dev(hr, "class", "hair-line");
    			add_location(hr, file$4, 304, 12, 14317);
    			add_location(br2, file$4, 304, 34, 14339);
    			add_location(br3, file$4, 306, 41, 14406);
    			add_location(input, file$4, 307, 25, 14439);
    			attr_dev(button3, "class", "pretty svelte-1wmo1b2");
    			button3.disabled = button3_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9].end;
    			add_location(button3, file$4, 308, 20, 14489);
    			add_location(div1, file$4, 305, 12, 14358);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p_1, anchor);
    			append_dev(p_1, t0);
    			append_dev(p_1, b);
    			append_dev(p_1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t4);
    			append_dev(div0, br0);
    			append_dev(div0, t5);
    			append_dev(div0, button0);
    			append_dev(button0, t6);
    			append_dev(div0, t7);
    			append_dev(div0, button1);
    			append_dev(button1, t8);
    			append_dev(div0, t9);
    			append_dev(div0, button2);
    			append_dev(button2, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, br3);
    			append_dev(div1, t16);
    			append_dev(div1, input);
    			set_input_value(input, /*answer*/ ctx[6]);
    			append_dev(div1, t17);
    			append_dev(div1, button3);
    			append_dev(button3, t18);
    			append_dev(div1, t19);
    			if (if_block) if_block.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_13*/ ctx[27], false, false, false),
    					listen_dev(button1, "click", /*click_handler_14*/ ctx[28], false, false, false),
    					listen_dev(button2, "click", /*click_handler_15*/ ctx[29], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_3*/ ctx[30]),
    					listen_dev(button3, "click", /*click_handler_16*/ ctx[31], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*timeout, object*/ 513 && button0_disabled_value !== (button0_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9][`clear${/*object*/ ctx[9].tag}`])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty[0] & /*timeout, object*/ 513 && button1_disabled_value !== (button1_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9][`clear${/*object*/ ctx[9].tag}`])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty[0] & /*timeout, object*/ 513 && button2_disabled_value !== (button2_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9][`clear${/*object*/ ctx[9].tag}`])) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}

    			if (dirty[0] & /*object*/ 512 && t15_value !== (t15_value = /*object*/ ctx[9][/*object*/ ctx[9].tag] + "")) set_data_dev(t15, t15_value);

    			if (dirty[0] & /*answer*/ 64 && input.value !== /*answer*/ ctx[6]) {
    				set_input_value(input, /*answer*/ ctx[6]);
    			}

    			if (dirty[0] & /*timeout, object*/ 513 && button3_disabled_value !== (button3_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9].end)) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}

    			if (/*object*/ ctx[9].end) {
    				if (if_block) ; else {
    					if_block = create_if_block_15(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p_1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(294:40) ",
    		ctx
    	});

    	return block;
    }

    // (272:40) 
    function create_if_block_10(ctx) {
    	let div0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let input;
    	let t4;
    	let button;
    	let t5;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function select_block_type_3(ctx, dirty) {
    		if (/*gameInfoStr*/ ctx[5][1] == "1") return create_if_block_11;
    		if (/*gameInfoStr*/ ctx[5][1] == "2") return create_if_block_12;
    		if (/*gameInfoStr*/ ctx[5][1] == "3") return create_if_block_13;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "이 게임은 주어진 영상의 길이에 맞는 설교 영상의 날짜를 찾는 게임입니다.";
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = text("정답: ");
    			input = element("input");
    			t4 = space();
    			button = element("button");
    			t5 = text("정답 확인");
    			add_location(div0, file$4, 272, 12, 12878);
    			attr_dev(input, "type", "date");
    			add_location(input, file$4, 291, 20, 13449);
    			attr_dev(button, "class", "pretty svelte-1wmo1b2");
    			button.disabled = button_disabled_value = /*p*/ ctx[4].clear[parseInt(/*gameInfoStr*/ ctx[5][1])];
    			add_location(button, file$4, 291, 61, 13490);
    			add_location(div1, file$4, 290, 12, 13422);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t3);
    			append_dev(div1, input);
    			set_input_value(input, /*answer*/ ctx[6]);
    			append_dev(div1, t4);
    			append_dev(div1, button);
    			append_dev(button, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_2*/ ctx[26]),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*p*/ ctx[4].check)) /*p*/ ctx[4].check.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type_3(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			}

    			if (dirty[0] & /*answer*/ 64) {
    				set_input_value(input, /*answer*/ ctx[6]);
    			}

    			if (dirty[0] & /*p, gameInfoStr*/ 48 && button_disabled_value !== (button_disabled_value = /*p*/ ctx[4].clear[parseInt(/*gameInfoStr*/ ctx[5][1])])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(272:40) ",
    		ctx
    	});

    	return block;
    }

    // (242:40) 
    function create_if_block_4(ctx) {
    	let div0;
    	let t0;
    	let b;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let input;
    	let t6;
    	let button;
    	let t7;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*gameInfoStr*/ ctx[5][1] == "1") return create_if_block_5;
    		if (/*gameInfoStr*/ ctx[5][1] == "2") return create_if_block_6;
    		if (/*gameInfoStr*/ ctx[5][1] == "3") return create_if_block_7;
    		if (/*gameInfoStr*/ ctx[5][1] == "4") return create_if_block_8;
    		if (/*gameInfoStr*/ ctx[5][1] == "5") return create_if_block_9;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("이 게임은 악보의 일부분을 보고 곡명을 맞히는 게임입니다. 곡명을 띄어쓰기를 포함하여 ");
    			b = element("b");
    			b.textContent = "정확하게";
    			t2 = text(" 입력해야 합니다.");
    			t3 = space();
    			if_block.c();
    			t4 = space();
    			div1 = element("div");
    			t5 = text("정답: ");
    			input = element("input");
    			t6 = space();
    			button = element("button");
    			t7 = text("정답 확인");
    			add_location(b, file$4, 243, 64, 11706);
    			add_location(div0, file$4, 242, 12, 11635);
    			add_location(input, file$4, 269, 20, 12672);
    			attr_dev(button, "class", "pretty svelte-1wmo1b2");
    			button.disabled = button_disabled_value = /*h*/ ctx[3].clear[parseInt(/*gameInfoStr*/ ctx[5][1])];
    			add_location(button, file$4, 269, 49, 12701);
    			add_location(div1, file$4, 268, 12, 12645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, b);
    			append_dev(div0, t2);
    			insert_dev(target, t3, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t5);
    			append_dev(div1, input);
    			set_input_value(input, /*answer*/ ctx[6]);
    			append_dev(div1, t6);
    			append_dev(div1, button);
    			append_dev(button, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[25]),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*h*/ ctx[3].check)) /*h*/ ctx[3].check.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type_2(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t4.parentNode, t4);
    				}
    			}

    			if (dirty[0] & /*answer*/ 64 && input.value !== /*answer*/ ctx[6]) {
    				set_input_value(input, /*answer*/ ctx[6]);
    			}

    			if (dirty[0] & /*h, gameInfoStr*/ 40 && button_disabled_value !== (button_disabled_value = /*h*/ ctx[3].clear[parseInt(/*gameInfoStr*/ ctx[5][1])])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(242:40) ",
    		ctx
    	});

    	return block;
    }

    // (208:8) {#if gameInfoStr[0] == 's'}
    function create_if_block$1(ctx) {
    	let div0;
    	let t0;
    	let b;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let input;
    	let t6;
    	let button;
    	let t7;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*gameInfoStr*/ ctx[5][1] == "1") return create_if_block_1;
    		if (/*gameInfoStr*/ ctx[5][1] == "2") return create_if_block_2;
    		if (/*gameInfoStr*/ ctx[5][1] == "3") return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("이 게임은 찬양의 일부분을 듣고 곡명을 맞히는 게임입니다. 곡명을 띄어쓰기를 포함하여 ");
    			b = element("b");
    			b.textContent = "정확하게";
    			t2 = text(" 입력해야 합니다.");
    			t3 = space();
    			if_block.c();
    			t4 = space();
    			div1 = element("div");
    			t5 = text("정답: ");
    			input = element("input");
    			t6 = space();
    			button = element("button");
    			t7 = text("정답 확인");
    			add_location(b, file$4, 209, 64, 10212);
    			add_location(div0, file$4, 208, 12, 10141);
    			add_location(input, file$4, 239, 20, 11429);
    			attr_dev(button, "class", "pretty svelte-1wmo1b2");
    			button.disabled = button_disabled_value = /*s*/ ctx[2].clear[parseInt(/*gameInfoStr*/ ctx[5][1])];
    			add_location(button, file$4, 239, 49, 11458);
    			add_location(div1, file$4, 238, 12, 11402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, b);
    			append_dev(div0, t2);
    			insert_dev(target, t3, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t5);
    			append_dev(div1, input);
    			set_input_value(input, /*answer*/ ctx[6]);
    			append_dev(div1, t6);
    			append_dev(div1, button);
    			append_dev(button, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[24]),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*s*/ ctx[2].check)) /*s*/ ctx[2].check.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t4.parentNode, t4);
    				}
    			}

    			if (dirty[0] & /*answer*/ 64 && input.value !== /*answer*/ ctx[6]) {
    				set_input_value(input, /*answer*/ ctx[6]);
    			}

    			if (dirty[0] & /*s, gameInfoStr*/ 36 && button_disabled_value !== (button_disabled_value = /*s*/ ctx[2].clear[parseInt(/*gameInfoStr*/ ctx[5][1])])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(208:8) {#if gameInfoStr[0] == 's'}",
    		ctx
    	});

    	return block;
    }

    // (334:12) {#if spdquiz.spdstart}
    function create_if_block_17(ctx) {
    	let hr;
    	let t0;
    	let div1;
    	let t1;
    	let t2_value = /*spdquiz*/ ctx[1].idx + "";
    	let t2;
    	let t3;
    	let p0;
    	let t4_value = /*spdquiz*/ ctx[1].quiz[/*spdquiz*/ ctx[1].idx] + "";
    	let t4;
    	let t5;
    	let input;
    	let t6;
    	let div0;
    	let button0;
    	let t7;
    	let button0_disabled_value;
    	let t8;
    	let button1;
    	let t9;
    	let button1_disabled_value;
    	let t10;
    	let p1;
    	let t11;
    	let t12;
    	let mounted;
    	let dispose;
    	let if_block = /*spdquiz*/ ctx[1].end && create_if_block_18(ctx);

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			div1 = element("div");
    			t1 = text("문제 ");
    			t2 = text(t2_value);
    			t3 = text("번\r\n                ");
    			p0 = element("p");
    			t4 = text(t4_value);
    			t5 = text("\r\n                    정답: ");
    			input = element("input");
    			t6 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t7 = text("정답 확인하기!");
    			t8 = space();
    			button1 = element("button");
    			t9 = text("다음문제");
    			t10 = space();
    			p1 = element("p");
    			t11 = text(/*correction*/ ctx[7]);
    			t12 = space();
    			if (if_block) if_block.c();
    			attr_dev(hr, "class", "hair-line");
    			add_location(hr, file$4, 334, 12, 15889);
    			add_location(p0, file$4, 337, 16, 15984);
    			add_location(input, file$4, 340, 24, 16084);
    			attr_dev(button0, "class", "pretty svelte-1wmo1b2");
    			button0.disabled = button0_disabled_value = /*timeout*/ ctx[0] | /*spdquiz*/ ctx[1].end | /*timer2*/ ctx[8].timerEnd | !/*spdquiz*/ ctx[1].spdstart | /*spdquiz*/ ctx[1].solved.includes(/*spdquiz*/ ctx[1].idx);
    			add_location(button0, file$4, 342, 20, 16157);
    			attr_dev(button1, "class", "pretty svelte-1wmo1b2");
    			button1.disabled = button1_disabled_value = /*timeout*/ ctx[0] | /*spdquiz*/ ctx[1].end | /*timer2*/ ctx[8].timerEnd | !/*spdquiz*/ ctx[1].spdstart;
    			add_location(button1, file$4, 343, 20, 16352);
    			add_location(p1, file$4, 344, 20, 16508);
    			add_location(div0, file$4, 341, 16, 16130);
    			add_location(div1, file$4, 335, 12, 15926);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, p0);
    			append_dev(p0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, input);
    			set_input_value(input, /*answer*/ ctx[6]);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(button0, t7);
    			append_dev(div0, t8);
    			append_dev(div0, button1);
    			append_dev(button1, t9);
    			append_dev(div0, t10);
    			append_dev(div0, p1);
    			append_dev(p1, t11);
    			append_dev(p1, t12);
    			if (if_block) if_block.m(p1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_4*/ ctx[33]),
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*spdquiz*/ ctx[1].sol)) /*spdquiz*/ ctx[1].sol.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*spdquiz*/ ctx[1].nxtquiz)) /*spdquiz*/ ctx[1].nxtquiz.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*spdquiz*/ 2 && t2_value !== (t2_value = /*spdquiz*/ ctx[1].idx + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*spdquiz*/ 2 && t4_value !== (t4_value = /*spdquiz*/ ctx[1].quiz[/*spdquiz*/ ctx[1].idx] + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*answer*/ 64 && input.value !== /*answer*/ ctx[6]) {
    				set_input_value(input, /*answer*/ ctx[6]);
    			}

    			if (dirty[0] & /*timeout, spdquiz, timer2*/ 259 && button0_disabled_value !== (button0_disabled_value = /*timeout*/ ctx[0] | /*spdquiz*/ ctx[1].end | /*timer2*/ ctx[8].timerEnd | !/*spdquiz*/ ctx[1].spdstart | /*spdquiz*/ ctx[1].solved.includes(/*spdquiz*/ ctx[1].idx))) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty[0] & /*timeout, spdquiz, timer2*/ 259 && button1_disabled_value !== (button1_disabled_value = /*timeout*/ ctx[0] | /*spdquiz*/ ctx[1].end | /*timer2*/ ctx[8].timerEnd | !/*spdquiz*/ ctx[1].spdstart)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty[0] & /*correction*/ 128) set_data_dev(t11, /*correction*/ ctx[7]);

    			if (/*spdquiz*/ ctx[1].end) {
    				if (if_block) ; else {
    					if_block = create_if_block_18(ctx);
    					if_block.c();
    					if_block.m(p1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_17.name,
    		type: "if",
    		source: "(334:12) {#if spdquiz.spdstart}",
    		ctx
    	});

    	return block;
    }

    // (346:24) {#if spdquiz.end}
    function create_if_block_18(ctx) {
    	let br;
    	let t;

    	const block = {
    		c: function create() {
    			br = element("br");
    			t = text("모든 문제를 다 푸셨습니다!");
    			add_location(br, file$4, 346, 28, 16596);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_18.name,
    		type: "if",
    		source: "(346:24) {#if spdquiz.end}",
    		ctx
    	});

    	return block;
    }

    // (324:20) {#if object.end}
    function create_if_block_15(ctx) {
    	let br;
    	let t;

    	const block = {
    		c: function create() {
    			br = element("br");
    			t = text("모든 물건을 다 찾았습니다!");
    			add_location(br, file$4, 324, 24, 15345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_15.name,
    		type: "if",
    		source: "(324:20) {#if object.end}",
    		ctx
    	});

    	return block;
    }

    // (288:12) {:else}
    function create_else_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "오류가 발생했습니다.";
    			add_location(div, file$4, 288, 16, 13367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(288:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (284:44) 
    function create_if_block_13(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "54분 46초";
    			add_location(div, file$4, 284, 16, 13269);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(284:44) ",
    		ctx
    	});

    	return block;
    }

    // (280:44) 
    function create_if_block_12(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "1시간 0분 49초";
    			add_location(div, file$4, 280, 16, 13144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(280:44) ",
    		ctx
    	});

    	return block;
    }

    // (276:12) {#if gameInfoStr[1] == '1'}
    function create_if_block_11(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "55분 14초";
    			add_location(div, file$4, 276, 16, 13022);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(276:12) {#if gameInfoStr[1] == '1'}",
    		ctx
    	});

    	return block;
    }

    // (266:12) {:else}
    function create_else_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "오류가 발생했습니다.";
    			add_location(div, file$4, 266, 16, 12590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(266:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (262:44) 
    function create_if_block_9(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			br = element("br");
    			if (img.src !== (img_src_value = "./data/h/h5.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "secret");
    			attr_dev(img, "class", "svelte-1wmo1b2");
    			add_location(img, file$4, 263, 20, 12480);
    			add_location(br, file$4, 263, 61, 12521);
    			add_location(div, file$4, 262, 16, 12453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(262:44) ",
    		ctx
    	});

    	return block;
    }

    // (258:44) 
    function create_if_block_8(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			br = element("br");
    			if (img.src !== (img_src_value = "./data/h/h4.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "secret");
    			attr_dev(img, "class", "svelte-1wmo1b2");
    			add_location(img, file$4, 259, 20, 12319);
    			add_location(br, file$4, 259, 61, 12360);
    			add_location(div, file$4, 258, 16, 12292);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(258:44) ",
    		ctx
    	});

    	return block;
    }

    // (254:44) 
    function create_if_block_7(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			br = element("br");
    			if (img.src !== (img_src_value = "./data/h/h3.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "secret");
    			attr_dev(img, "class", "svelte-1wmo1b2");
    			add_location(img, file$4, 255, 20, 12158);
    			add_location(br, file$4, 255, 61, 12199);
    			add_location(div, file$4, 254, 16, 12131);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(254:44) ",
    		ctx
    	});

    	return block;
    }

    // (250:44) 
    function create_if_block_6(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			br = element("br");
    			if (img.src !== (img_src_value = "./data/h/h2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "secret");
    			attr_dev(img, "class", "svelte-1wmo1b2");
    			add_location(img, file$4, 251, 20, 11997);
    			add_location(br, file$4, 251, 61, 12038);
    			add_location(div, file$4, 250, 16, 11970);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(250:44) ",
    		ctx
    	});

    	return block;
    }

    // (246:12) {#if gameInfoStr[1] == '1'}
    function create_if_block_5(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			br = element("br");
    			if (img.src !== (img_src_value = "./data/h/h1.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "secret");
    			attr_dev(img, "class", "svelte-1wmo1b2");
    			add_location(img, file$4, 247, 20, 11833);
    			add_location(br, file$4, 247, 61, 11874);
    			add_location(div, file$4, 246, 16, 11806);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(246:12) {#if gameInfoStr[1] == '1'}",
    		ctx
    	});

    	return block;
    }

    // (236:12) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "오류가 발생했습니다.";
    			add_location(div, file$4, 236, 16, 11347);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(236:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (228:44) 
    function create_if_block_3(ctx) {
    	let div;
    	let audio;
    	let source;
    	let source_src_value;
    	let track;
    	let track_src_value;
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			audio = element("audio");
    			source = element("source");
    			track = element("track");
    			t = text("\r\n                        크롬 브라우저를 이용해 주세요\r\n                    ");
    			br = element("br");
    			if (source.src !== (source_src_value = "./data/s/s3.mp3")) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "audio/mpeg");
    			add_location(source, file$4, 230, 24, 11088);
    			attr_dev(track, "kind", "captions");
    			if (track.src !== (track_src_value = "./data/etc.vtt")) attr_dev(track, "src", track_src_value);
    			add_location(track, file$4, 231, 24, 11162);
    			audio.controls = true;
    			add_location(audio, file$4, 229, 20, 11046);
    			add_location(br, file$4, 233, 28, 11278);
    			add_location(div, file$4, 228, 16, 11019);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, audio);
    			append_dev(audio, source);
    			append_dev(audio, track);
    			append_dev(audio, t);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(228:44) ",
    		ctx
    	});

    	return block;
    }

    // (220:44) 
    function create_if_block_2(ctx) {
    	let div;
    	let audio;
    	let source;
    	let source_src_value;
    	let track;
    	let track_src_value;
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			audio = element("audio");
    			source = element("source");
    			track = element("track");
    			t = text("\r\n                        크롬 브라우저를 이용해 주세요\r\n                    ");
    			br = element("br");
    			if (source.src !== (source_src_value = "./data/s/s2.mp3")) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "audio/mpeg");
    			add_location(source, file$4, 222, 24, 10736);
    			attr_dev(track, "kind", "captions");
    			if (track.src !== (track_src_value = "./data/etc.vtt")) attr_dev(track, "src", track_src_value);
    			add_location(track, file$4, 223, 24, 10810);
    			audio.controls = true;
    			add_location(audio, file$4, 221, 20, 10694);
    			add_location(br, file$4, 225, 28, 10926);
    			add_location(div, file$4, 220, 16, 10667);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, audio);
    			append_dev(audio, source);
    			append_dev(audio, track);
    			append_dev(audio, t);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(220:44) ",
    		ctx
    	});

    	return block;
    }

    // (212:12) {#if gameInfoStr[1] == '1'}
    function create_if_block_1(ctx) {
    	let div;
    	let audio;
    	let source;
    	let source_src_value;
    	let track;
    	let track_src_value;
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			audio = element("audio");
    			source = element("source");
    			track = element("track");
    			t = text("\r\n                        크롬 브라우저를 이용해 주세요\r\n                    ");
    			br = element("br");
    			if (source.src !== (source_src_value = "./data/s/s1.mp3")) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "audio/mpeg");
    			add_location(source, file$4, 214, 24, 10381);
    			attr_dev(track, "kind", "captions");
    			if (track.src !== (track_src_value = "./data/etc.vtt")) attr_dev(track, "src", track_src_value);
    			add_location(track, file$4, 215, 24, 10455);
    			audio.controls = true;
    			add_location(audio, file$4, 213, 20, 10339);
    			add_location(br, file$4, 217, 28, 10571);
    			add_location(div, file$4, 212, 16, 10312);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, audio);
    			append_dev(audio, source);
    			append_dev(audio, track);
    			append_dev(audio, t);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(212:12) {#if gameInfoStr[1] == '1'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let br0;
    	let br1;
    	let t0;
    	let div0;
    	let button0;
    	let t1;
    	let button0_disabled_value;
    	let t2;
    	let button1;
    	let t3;
    	let button1_disabled_value;
    	let t4;
    	let button2;
    	let t5;
    	let button2_disabled_value;
    	let t6;
    	let button3;
    	let t7;
    	let button3_disabled_value;
    	let t8;
    	let button4;
    	let t9;
    	let button4_disabled_value;
    	let t10;
    	let button5;
    	let t11;
    	let button5_disabled_value;
    	let t12;
    	let button6;
    	let t13;
    	let button6_disabled_value;
    	let t14;
    	let button7;
    	let t15;
    	let button7_disabled_value;
    	let t16;
    	let button8;
    	let t17;
    	let button8_disabled_value;
    	let t18;
    	let button9;
    	let t19;
    	let button9_disabled_value;
    	let t20;
    	let button10;
    	let t21;
    	let button10_disabled_value;
    	let t22;
    	let button11;
    	let t23;
    	let button11_disabled_value;
    	let t24;
    	let button12;
    	let t25;
    	let button12_disabled_value;
    	let t26;
    	let div1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*gameInfoStr*/ ctx[5][0] == "s") return create_if_block$1;
    		if (/*gameInfoStr*/ ctx[5][0] == "h") return create_if_block_4;
    		if (/*gameInfoStr*/ ctx[5][0] == "p") return create_if_block_10;
    		if (/*gameInfoStr*/ ctx[5][0] == "o") return create_if_block_14;
    		if (/*gameInfoStr*/ ctx[5][0] == "q") return create_if_block_16;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			br0 = element("br");
    			br1 = element("br");
    			t0 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t1 = text("찬양 듣고 찬양 제목 맞히기 1");
    			t2 = space();
    			button1 = element("button");
    			t3 = text("찬양 듣고 찬양 제목 맞히기 2");
    			t4 = space();
    			button2 = element("button");
    			t5 = text("찬양 듣고 찬양 제목 맞히기 3");
    			t6 = space();
    			button3 = element("button");
    			t7 = text("악보 보고 찬양 제목 맞히기 1");
    			t8 = space();
    			button4 = element("button");
    			t9 = text("악보 보고 찬양 제목 맞히기 2");
    			t10 = space();
    			button5 = element("button");
    			t11 = text("악보 보고 찬양 제목 맞히기 3");
    			t12 = space();
    			button6 = element("button");
    			t13 = text("악보 보고 찬양 제목 맞히기 4");
    			t14 = space();
    			button7 = element("button");
    			t15 = text("악보 보고 찬양 제목 맞히기 5");
    			t16 = space();
    			button8 = element("button");
    			t17 = text("설교 영상 날짜 맞히기 1");
    			t18 = space();
    			button9 = element("button");
    			t19 = text("설교 영상 날짜 맞히기 2");
    			t20 = space();
    			button10 = element("button");
    			t21 = text("설교 영상 날짜 맞히기 3");
    			t22 = space();
    			button11 = element("button");
    			t23 = text("스피드퀴즈");
    			t24 = space();
    			button12 = element("button");
    			t25 = text("물건 찾기");
    			t26 = space();
    			div1 = element("div");
    			if_block.c();
    			add_location(br0, file$4, 188, 4, 8186);
    			add_location(br1, file$4, 188, 9, 8191);
    			button0.disabled = button0_disabled_value = /*timeout*/ ctx[0] | /*s*/ ctx[2].clear[1];
    			attr_dev(button0, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button0, file$4, 191, 8, 8265);
    			button1.disabled = button1_disabled_value = /*timeout*/ ctx[0] | /*s*/ ctx[2].clear[2];
    			attr_dev(button1, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button1, file$4, 192, 8, 8399);
    			button2.disabled = button2_disabled_value = /*timeout*/ ctx[0] | /*s*/ ctx[2].clear[3];
    			attr_dev(button2, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button2, file$4, 193, 8, 8533);
    			button3.disabled = button3_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[1];
    			attr_dev(button3, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button3, file$4, 194, 8, 8667);
    			button4.disabled = button4_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[2];
    			attr_dev(button4, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button4, file$4, 195, 8, 8801);
    			button5.disabled = button5_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[3];
    			attr_dev(button5, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button5, file$4, 196, 8, 8935);
    			button6.disabled = button6_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[4];
    			attr_dev(button6, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button6, file$4, 197, 8, 9069);
    			button7.disabled = button7_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[5];
    			attr_dev(button7, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button7, file$4, 198, 8, 9203);
    			button8.disabled = button8_disabled_value = /*timeout*/ ctx[0] | /*p*/ ctx[4].clear[1];
    			attr_dev(button8, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button8, file$4, 199, 8, 9337);
    			button9.disabled = button9_disabled_value = /*timeout*/ ctx[0] | /*p*/ ctx[4].clear[2];
    			attr_dev(button9, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button9, file$4, 200, 8, 9468);
    			button10.disabled = button10_disabled_value = /*timeout*/ ctx[0] | /*p*/ ctx[4].clear[3];
    			attr_dev(button10, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button10, file$4, 201, 8, 9599);
    			button11.disabled = button11_disabled_value = /*timeout*/ ctx[0] | /*spdquiz*/ ctx[1].end | /*timer2*/ ctx[8].timerEnd | /*spdquiz*/ ctx[1].spdstart;
    			attr_dev(button11, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button11, file$4, 202, 8, 9730);
    			button12.disabled = button12_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9].end;
    			attr_dev(button12, "class", "pretty-grey svelte-1wmo1b2");
    			add_location(button12, file$4, 203, 8, 9889);
    			attr_dev(div0, "class", "tab-items svelte-1wmo1b2");
    			add_location(div0, file$4, 190, 4, 8232);
    			set_style(div1, "text-align", "center");
    			set_style(div1, "padding", "15px");
    			add_location(div1, file$4, 206, 4, 10043);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(button1, t3);
    			append_dev(div0, t4);
    			append_dev(div0, button2);
    			append_dev(button2, t5);
    			append_dev(div0, t6);
    			append_dev(div0, button3);
    			append_dev(button3, t7);
    			append_dev(div0, t8);
    			append_dev(div0, button4);
    			append_dev(button4, t9);
    			append_dev(div0, t10);
    			append_dev(div0, button5);
    			append_dev(button5, t11);
    			append_dev(div0, t12);
    			append_dev(div0, button6);
    			append_dev(button6, t13);
    			append_dev(div0, t14);
    			append_dev(div0, button7);
    			append_dev(button7, t15);
    			append_dev(div0, t16);
    			append_dev(div0, button8);
    			append_dev(button8, t17);
    			append_dev(div0, t18);
    			append_dev(div0, button9);
    			append_dev(button9, t19);
    			append_dev(div0, t20);
    			append_dev(div0, button10);
    			append_dev(button10, t21);
    			append_dev(div0, t22);
    			append_dev(div0, button11);
    			append_dev(button11, t23);
    			append_dev(div0, t24);
    			append_dev(div0, button12);
    			append_dev(button12, t25);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[14], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[15], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[16], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[17], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[18], false, false, false),
    					listen_dev(button8, "click", /*click_handler_8*/ ctx[19], false, false, false),
    					listen_dev(button9, "click", /*click_handler_9*/ ctx[20], false, false, false),
    					listen_dev(button10, "click", /*click_handler_10*/ ctx[21], false, false, false),
    					listen_dev(button11, "click", /*click_handler_11*/ ctx[22], false, false, false),
    					listen_dev(button12, "click", /*click_handler_12*/ ctx[23], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*timeout, s*/ 5 && button0_disabled_value !== (button0_disabled_value = /*timeout*/ ctx[0] | /*s*/ ctx[2].clear[1])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty[0] & /*timeout, s*/ 5 && button1_disabled_value !== (button1_disabled_value = /*timeout*/ ctx[0] | /*s*/ ctx[2].clear[2])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty[0] & /*timeout, s*/ 5 && button2_disabled_value !== (button2_disabled_value = /*timeout*/ ctx[0] | /*s*/ ctx[2].clear[3])) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}

    			if (dirty[0] & /*timeout, h*/ 9 && button3_disabled_value !== (button3_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[1])) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}

    			if (dirty[0] & /*timeout, h*/ 9 && button4_disabled_value !== (button4_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[2])) {
    				prop_dev(button4, "disabled", button4_disabled_value);
    			}

    			if (dirty[0] & /*timeout, h*/ 9 && button5_disabled_value !== (button5_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[3])) {
    				prop_dev(button5, "disabled", button5_disabled_value);
    			}

    			if (dirty[0] & /*timeout, h*/ 9 && button6_disabled_value !== (button6_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[4])) {
    				prop_dev(button6, "disabled", button6_disabled_value);
    			}

    			if (dirty[0] & /*timeout, h*/ 9 && button7_disabled_value !== (button7_disabled_value = /*timeout*/ ctx[0] | /*h*/ ctx[3].clear[5])) {
    				prop_dev(button7, "disabled", button7_disabled_value);
    			}

    			if (dirty[0] & /*timeout, p*/ 17 && button8_disabled_value !== (button8_disabled_value = /*timeout*/ ctx[0] | /*p*/ ctx[4].clear[1])) {
    				prop_dev(button8, "disabled", button8_disabled_value);
    			}

    			if (dirty[0] & /*timeout, p*/ 17 && button9_disabled_value !== (button9_disabled_value = /*timeout*/ ctx[0] | /*p*/ ctx[4].clear[2])) {
    				prop_dev(button9, "disabled", button9_disabled_value);
    			}

    			if (dirty[0] & /*timeout, p*/ 17 && button10_disabled_value !== (button10_disabled_value = /*timeout*/ ctx[0] | /*p*/ ctx[4].clear[3])) {
    				prop_dev(button10, "disabled", button10_disabled_value);
    			}

    			if (dirty[0] & /*timeout, spdquiz, timer2*/ 259 && button11_disabled_value !== (button11_disabled_value = /*timeout*/ ctx[0] | /*spdquiz*/ ctx[1].end | /*timer2*/ ctx[8].timerEnd | /*spdquiz*/ ctx[1].spdstart)) {
    				prop_dev(button11, "disabled", button11_disabled_value);
    			}

    			if (dirty[0] & /*timeout, object*/ 513 && button12_disabled_value !== (button12_disabled_value = /*timeout*/ ctx[0] | /*object*/ ctx[9].end)) {
    				prop_dev(button12, "disabled", button12_disabled_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $varypuzzlecount;
    	validate_store(varypuzzlecount, "varypuzzlecount");
    	component_subscribe($$self, varypuzzlecount, $$value => $$invalidate(34, $varypuzzlecount = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Varypuzzle", slots, []);
    	let { timeout } = $$props;
    	let gameInfoStr = ""; //v:verse s:song h:sheet p:preach o:object q:speedquiz
    	let answer, correction = "";

    	const timer2 = {
    		timerId: null,
    		timeLeft: 0,
    		timerEnd: false
    	};

    	async function setSpeedquizTimer(second) {
    		$$invalidate(8, timer2.timerEnd = false, timer2);

    		$$invalidate(
    			8,
    			timer2.timerId = setInterval(
    				() => {
    					$$invalidate(8, timer2.timeLeft--, timer2);
    				},
    				1000
    			),
    			timer2
    		);

    		setTimeout(
    			() => {
    				$$invalidate(8, timer2.timerEnd = true, timer2);
    				clearInterval(timer2.timerId);
    			},
    			second * 1000
    		);

    		$$invalidate(8, timer2.timeLeft = second, timer2);
    	}

    	let spdquiz = {
    		spdstart: false, // 퀴즈 시작확인
    		i: 0, //배열 저장용 인덱스
    		idx: 1, //현재 문제
    		quiz: [
    			null,
    			`[창세기 1장] 태초에 천지를 창조하신 분은 누구이신가요?`,
    			`[출애굽기 12장] 이스라엘 백성이 출애굽을 기념하여 지키는 절기는 무엇인가요?`,
    			`[열왕기상 12장] 빈칸에 들어갈 알맞은 말은 무엇인가요?
솔로몬 왕 사후 이스라엘은 북왕국과 남왕국으로 분리됩니다. 북 이스라엘 여로보암 왕의 우상 숭배에 관한 아래 본문을 채우세요. 
'만일 이 백성이 예루살렘에 있는 여호와의 전에 제사를 드리고자 하여 올라가면 이 백성의 마음이 유다 왕 된 그 주 르호보암에게로 돌아가서 나를 죽이고 유다 왕 르호보암에게로 돌아가리로다 하고 이에 계획하고 두  _ _ _ _ 을(를) 만들고 무리에게 말하기를 너희가 다시는 예루살렘에 올라갈 것이 없도다 이스라엘아 이는 너희를 애굽 땅에서 인도하여 올린 너희 신이라 하고' `,
    			`[요한계시록 11장] 다음 본문에 들어갈 숫자는 얼마인가요?
"일곱째 천사가 나팔을 불매 하늘에 큰 음성들이 나서 가로되 세상 나라가 우리 주와 그 그리스도의 나라가 되어 그가 세세토록 왕노릇 하시리로다 하니 하나님 앞에 자기 보좌에 앉은  _ _ 장로들이 엎드려 얼굴을 대고 하나님께 경배하여"`,
    			`[요한복음 1장] "내 뒤에 오시는 이가 나보다 앞선 것은 나보다 먼저 계심이니라" 라는 말을 한 사람은? (_ _ _ _)`,
    			`[출애굽기 40장] 이스라엘 백성들은 출애굽 후 성막을 건축했습니다. 성막 봉헌에 관한 다음 본문에 알맞은 말은 무엇인가요?  
'또 번제단을 회막의 성막 문 앞에 놓고 또  _ _ _ 을 회막과 단 사이에 놓고 그 속에 물을 담고 또 뜰 주위에 포장을 치고 뜰 문에 장을 달고'`,
    			`[역대하 36장] 바사제국의 초대 왕으로 바벨론을 정복하였으며 유대 백성의 귀국을 허락하고 이스라엘 민족에게 유다로 돌아가서 성전을 재건하라고 권면한 사람은 누구인가요? (_ _ _)`,
    			`[다니엘 3장] 다음은 우상 숭배를 거부한 다니엘의 친구들이 한 말입니다. 본문 빈 칸을 채우세요. 
"만일 그럴 것이면 왕이여 우리가 섬기는 우리 하나님이 우리를 극렬히 타는 풀무 가운데서 능히 건져내시겠고 왕의 손에서도 건져내시리이다 그리 아니하실찌라도 왕이여 우리가 왕의 신들을 섬기지도 아니하고 왕의 세우신  _ _ _ 에게 절하지도 아니할 줄을 아옵소서" `,
    			`[요한계시록 21장] 다음은 새 예루살렘에 들어 갈 자격에 관한 요한계시록 말씀입니다다. 본문의 빈칸에 알맞은 말은 무엇인가요?
"사람들이 만국의 영광과 존귀를 가지고 그리로 들어오겠고 무엇이든지 속된 것이나 가증한 일 또는 거짓말 하는 자는 결코 그리로 들어오지 못하되 오직 어린 양의  _ _ _ 에 기록된 자들뿐이라"`,
    			`[여호수아 2장] 여호수아가 여리고 성을 공격하기에 앞서 정탐을 보낸 일에 관한 아래 본문을 채우세요. 
'눈의 아들 여호수아가 싯딤에서 두 사람을 정탐으로 가만히 보내며 그들에게 이르되 가서 그 땅과 여리고를 엿보라 하매 그들이 가서 _ _이라 하는 기생의 집에 들어가 거기서 유숙하더니'`,
    			`[에베소서 1장] 다음 성경 본문은 그리스도를 향한 하나님의 능력을 설명하고 있습니다. 본문의 빈칸에 들어갈 말은 무엇인가요?
"그 능력이 그리스도 안에서 역사하사 죽은 자들 가운데서 다시 살리시고 하늘에서 자기의 오른편에 앉히사 모든 정사와 권세와 능력과 주관하는 자와 이 세상뿐 아니라 오는 세상에 일컫는 모든 이름 위에 뛰어나게 하시고 또 만물을 그 발 아래 복종하게 하시고 그를 만물 위에 교회의 _ _ 로 주셨느니라"`,
    			`[베드로전서 3장] 다음은 '선을 위한 고난'에 관한 베드로 후서 말씀입니다. 본문의 빈칸에 들어갈 말은 무엇인가요?
"그들은 전에 노아의 날 방주 예비할 동안 하나님이 오래 참고 기다리실 때에 순종치 아니하던 자들이라 방주에서 물로 말미암아 구원을 얻은 자가 몇명 뿐이니 겨우 _ _ 명이라"`,
    			`구약성경의 마지막 책은 무엇일까요?`,
    			`[빌립보서 4장] 다음은 바울이 빌립보교회 성도들에게 권면하는 내용입니다. 두 빈칸을 한 단어로 채우세요.
"주 안에서 항상 _ _ 하라 내가 다시 말하노니 _ _ 하라 너희 관용을 모든 사람에게 알게 하라 주께서 가까우시니라"`,
    			`[갈라디아서 3장] 갈라디아서 3장에는 율법에 관하여 "이같이 율법이 우리를 그리스도에게로 인도하는 _ _ _ _ 가(이) 되어 우리로 하여금 믿음으로 말미암아 의롭다 함을 얻게 하려 함이니라"라고 기록되어 있습니다. 빈 칸에 알맞는 말을 채우세요.`,
    			`[시편 46편] 다음은 하나님의 강력한 보호의 손길을 노래한 시의 일부입니다. 본문의 빈칸을 채우세요. 
'바닷물이 흉용하고 뛰놀든지 그것이 넘침으로 산이 요동할찌라도 우리는 두려워 아니하리로다 (셀라) 한 시내가 있어 나뉘어 흘러 하나님의 성 곧 지극히 높으신 자의 장막의 성소를 기쁘게 하도다 하나님이 그 성중에 거하시매 성이 요동치 아니할 것이라 _ _ 에 하나님이 도우시리로다'`,
    			`[출애굽기 40장] 이스라엘 백성들은 출애굽 후 성막을 건축했습니다. 성막 봉헌에 관한 다음 본문의 빈칸을 채우세요.
'또 금 향단을 증거궤 앞에 두고 성막 문에 장을 달고 또 번제단을 _ _ 의 성막 문 앞에 놓고'`,
    			`[역대하 17장] 다음은 여호와 보시기에 선정을 베풀었던 남 유다 여호사밧 왕의 업적과 그 시대 상황에 관한 기록입니다. 여호사밧의 강한 군대와 관련한 아래 본문의 빈칸을 채우세요. 
'여호사밧이 점점 강대하여 유다에 견고한 채와 국고성을 건축하고 유다 각 성에 역사를 많이 하고 또 예루살렘에 크게 용맹한 군사를 두었으니 군사의 수효가 그 족속대로 이러하니라 유다에 속한 천부장 중에는 _ _ _ 가 으뜸이 되어 큰 용사 삼십만을 거느렸고'`,
    			`[여호수아 19장]
출애굽한 이스라엘 백성은 가나안을 정복한 후 지파별로 기업을 분배하였다. 이에 관한 아래 본문을 빈칸을 한 단어로 채우세요.
'여섯째로 _ _ _ 자손을 위하여 _ _ _ 자손의 가족대로 제비를 뽑았으니 그 경계는 헬렙과 사아난님의 상수리나무에서부터 아다미 네겝과 얍느엘을 지나 락굼까지요 그 끝은 요단이며 ... 이론과 믹다렐과 호렘과 벧 아낫과 벧 세메스니 모두 십 구 성읍이요 또 그 촌락이라 _ _ _ 자손의 지파가 그 가족대로 얻은 기업은 이 성읍들과 그 촌락이었더라'`,
    			`신약성경의 첫번째 책은 무엇일까요?`
    		],
    		//문제 해설 배열
    		list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], //풀이 가능한 문제 리스트
    		ans: [
    			null,
    			"하나님",
    			"유월절",
    			"금송아지",
    			"24",
    			"세례요한",
    			"물두멍",
    			"고레스",
    			"금신상",
    			"생명책",
    			"라합",
    			"머리",
    			"여덟",
    			"말라기",
    			"기뻐",
    			"몽학선생",
    			"새벽",
    			"회막",
    			"아드나",
    			"납달리",
    			"마태복음"
    		],
    		// 정답 배열
    		solved: [], //푼 문제 체크
    		end: false, //끝남 체크
    		nxtquiz() {
    			if (spdquiz.list.length == 0) {
    				$$invalidate(1, spdquiz.end = true, spdquiz); //문제 넘김 함수
    				return;
    			}

    			if (spdquiz.i == spdquiz.list.length - 1) {
    				$$invalidate(1, spdquiz.i = 0, spdquiz);
    				$$invalidate(1, spdquiz.idx = spdquiz.list[spdquiz.i], spdquiz);
    			} else {
    				$$invalidate(1, spdquiz.i++, spdquiz);
    				$$invalidate(1, spdquiz.idx = spdquiz.list[spdquiz.i], spdquiz);
    			}
    		}, //문제 넘김 함수
    		sol() {
    			let t = answer.replace(/\s/gi, "");

    			if (t == spdquiz.ans[spdquiz.idx]) {
    				$$invalidate(7, correction = "정답입니다.");

    				setTimeout(
    					() => {
    						$$invalidate(7, correction = "");
    					},
    					1500
    				);

    				spdquiz.solved.push(spdquiz.idx);

    				if (spdquiz.solved.length == 20) {
    					$$invalidate(1, spdquiz.end = true, spdquiz);
    					return;
    				}

    				if (spdquiz.i == spdquiz.list.length - 1) {
    					$$invalidate(1, spdquiz.i = 0, spdquiz);
    					$$invalidate(1, spdquiz.idx = spdquiz.list[spdquiz.i], spdquiz);
    					return;
    				}
    			} else {
    				$$invalidate(7, correction = "오답입니다.");
    			}
    		}
    	}; // 풀이시 실행

    	let object = {
    		tag: "none",
    		none: "",
    		hard: "도미노, 줄자, 애완동물, 오르골, CD, 폴더폰, 무드등, 국어사전, 카메라, 라디오",
    		medium: "모자, A4용지, 스테이플러, 스피커, 시계, 무선충전기, 열쇠, 은혜와진리찬양집, 태극기, 가족사진",
    		easy: "칫솔, 슬리퍼, 샤프, 선크림, 달력, USB, 포스트잇, 성경책, 건전지, 면봉, 손톱깎이",
    		clearhard: false,
    		clearmedium: false,
    		cleareasy: false,
    		clearnone: false,
    		end: false,
    		ans: {
    			hard: "오병이어1252",
    			medium: "팔복8135",
    			easy: "만선15310"
    		}
    	};

    	/*
    let v = {
        clear:[null, false, false, false],
        ans: [],
        check: function()
        {
            if (v.ans[parseInt(gameInfoStr[1])] == answer)
            {
                alert("정답입니다.");
                v.clear[parseInt(gameInfoStr[1])] = true;
            }
            else alert("오답입니다.")
        }
    }*/
    	let s = {
    		clear: [null, false, false, false],
    		ans: [null, "온 땅이여 하나님께 즐거운 소리를 발할지어다", "하나님께서 우리를", "주는 나의 방패시요"],
    		check() {
    			if (s.ans[parseInt(gameInfoStr[1])] == answer) {
    				alert("정답입니다.");
    				$$invalidate(2, s.clear[parseInt(gameInfoStr[1])] = true, s);
    			} else alert("오답입니다.");
    		}
    	};

    	let h = {
    		clear: [null, false, false, false, false, false],
    		ans: [null, "보라 대속의 십자가", "성도의 생활", "여호와는 자비로우시며", "내 영혼이 잠잠히", "아무 것도 염려치 말고"],
    		check() {
    			if (h.ans[parseInt(gameInfoStr[1])] == answer) {
    				alert("정답입니다.");
    				$$invalidate(3, h.clear[parseInt(gameInfoStr[1])] = true, h);
    			} else alert("오답입니다.");
    		}
    	};

    	let p = {
    		clear: [null, false, false, false],
    		ans: [null, "2021-02-08", "2020-06-01", "2020-02-24"],
    		check() {
    			if (p.ans[parseInt(gameInfoStr[1])] == answer) {
    				alert("정답입니다.");
    				$$invalidate(4, p.clear[parseInt(gameInfoStr[1])] = true, p);
    			} else alert("오답입니다.");
    		}
    	};

    	const writable_props = ["timeout"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Varypuzzle> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(5, gameInfoStr = "s1");
    	const click_handler_1 = () => $$invalidate(5, gameInfoStr = "s2");
    	const click_handler_2 = () => $$invalidate(5, gameInfoStr = "s3");
    	const click_handler_3 = () => $$invalidate(5, gameInfoStr = "h1");
    	const click_handler_4 = () => $$invalidate(5, gameInfoStr = "h2");
    	const click_handler_5 = () => $$invalidate(5, gameInfoStr = "h3");
    	const click_handler_6 = () => $$invalidate(5, gameInfoStr = "h4");
    	const click_handler_7 = () => $$invalidate(5, gameInfoStr = "h5");
    	const click_handler_8 = () => $$invalidate(5, gameInfoStr = "p1");
    	const click_handler_9 = () => $$invalidate(5, gameInfoStr = "p2");
    	const click_handler_10 = () => $$invalidate(5, gameInfoStr = "p3");
    	const click_handler_11 = () => $$invalidate(5, gameInfoStr = "q");
    	const click_handler_12 = () => $$invalidate(5, gameInfoStr = "o");

    	function input_input_handler() {
    		answer = this.value;
    		$$invalidate(6, answer);
    	}

    	function input_input_handler_1() {
    		answer = this.value;
    		$$invalidate(6, answer);
    	}

    	function input_input_handler_2() {
    		answer = this.value;
    		$$invalidate(6, answer);
    	}

    	const click_handler_13 = () => {
    		$$invalidate(9, object.tag = "hard", object);
    	};

    	const click_handler_14 = () => {
    		$$invalidate(9, object.tag = "medium", object);
    	};

    	const click_handler_15 = () => {
    		$$invalidate(9, object.tag = "easy", object);
    	};

    	function input_input_handler_3() {
    		answer = this.value;
    		$$invalidate(6, answer);
    	}

    	const click_handler_16 = () => {
    		if (object.tag == "none") {
    			alert("올바르지 않은 접근입니다.");
    			return;
    		}

    		

    		if (answer == object.ans[object.tag]) {
    			alert("정답입니다!");
    			$$invalidate(9, object[`clear${object.tag}`] = true, object);

    			if (object.clearhard && object.clearmedium && object.cleareasy) {
    				$$invalidate(9, object.end = true, object);
    			}
    		} else alert("코드가 올바르지 않습니다.");
    	};

    	const click_handler_17 = () => {
    		setSpeedquizTimer(180);
    		$$invalidate(1, spdquiz.spdstart = true, spdquiz);
    	};

    	function input_input_handler_4() {
    		answer = this.value;
    		$$invalidate(6, answer);
    	}

    	$$self.$$set = $$props => {
    		if ("timeout" in $$props) $$invalidate(0, timeout = $$props.timeout);
    	};

    	$$self.$capture_state = () => ({
    		timeout,
    		varypuzzlecount,
    		gameInfoStr,
    		answer,
    		correction,
    		timer2,
    		setSpeedquizTimer,
    		spdquiz,
    		object,
    		s,
    		h,
    		p,
    		$varypuzzlecount
    	});

    	$$self.$inject_state = $$props => {
    		if ("timeout" in $$props) $$invalidate(0, timeout = $$props.timeout);
    		if ("gameInfoStr" in $$props) $$invalidate(5, gameInfoStr = $$props.gameInfoStr);
    		if ("answer" in $$props) $$invalidate(6, answer = $$props.answer);
    		if ("correction" in $$props) $$invalidate(7, correction = $$props.correction);
    		if ("spdquiz" in $$props) $$invalidate(1, spdquiz = $$props.spdquiz);
    		if ("object" in $$props) $$invalidate(9, object = $$props.object);
    		if ("s" in $$props) $$invalidate(2, s = $$props.s);
    		if ("h" in $$props) $$invalidate(3, h = $$props.h);
    		if ("p" in $$props) $$invalidate(4, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*timeout, spdquiz, p, s, h*/ 31) {
    			 if (timeout == true) set_store_value(varypuzzlecount, $varypuzzlecount = spdquiz.solved.length + p.clear.filter(x => x).length + s.clear.filter(x => x).length + h.clear.filter(x => x).length, $varypuzzlecount);
    		}
    	};

    	return [
    		timeout,
    		spdquiz,
    		s,
    		h,
    		p,
    		gameInfoStr,
    		answer,
    		correction,
    		timer2,
    		object,
    		setSpeedquizTimer,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		input_input_handler,
    		input_input_handler_1,
    		input_input_handler_2,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15,
    		input_input_handler_3,
    		click_handler_16,
    		click_handler_17,
    		input_input_handler_4
    	];
    }

    class Varypuzzle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { timeout: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Varypuzzle",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*timeout*/ ctx[0] === undefined && !("timeout" in props)) {
    			console.warn("<Varypuzzle> was created without expected prop 'timeout'");
    		}
    	}

    	get timeout() {
    		throw new Error("<Varypuzzle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeout(value) {
    		throw new Error("<Varypuzzle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.32.1 */
    const file$5 = "src\\App.svelte";

    // (107:0) {#if firstPage}
    function create_if_block_7$1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let button;
    	let b;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "할렐루야! 성전별 모임에 오신 것을 환영합니다!";
    			t1 = space();
    			button = element("button");
    			b = element("b");
    			b.textContent = "시작하기";
    			set_style(h1, "color", "pink");
    			add_location(h1, file$5, 111, 8, 3856);
    			add_location(b, file$5, 112, 82, 3994);
    			attr_dev(button, "class", "pretty svelte-xjnb3p");
    			set_style(button, "font-size", "1.25em");
    			add_location(button, file$5, 112, 8, 3920);
    			set_style(div0, "text-align", "center");
    			add_location(div0, file$5, 110, 4, 3814);
    			set_style(div1, "height", "100%");
    			set_style(div1, "width", "100%");
    			set_style(div1, "background-image", "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.1))");
    			set_style(div1, "opacity", "100%");
    			set_style(div1, "background-size", "cover");
    			set_style(div1, "position", "absolute");
    			set_style(div1, "left", "0");
    			set_style(div1, "right", "0");
    			set_style(div1, "top", "0");
    			set_style(div1, "bottom", "0");
    			set_style(div1, "display", "flex");
    			set_style(div1, "justify-content", "center");
    			set_style(div1, "align-items", "center");
    			set_style(div1, "z-index", "5");
    			attr_dev(div1, "id", "canvas1");
    			add_location(div1, file$5, 107, 0, 3467);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, b);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*clickStart*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 1000 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 1000 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(107:0) {#if firstPage}",
    		ctx
    	});

    	return block;
    }

    // (142:8) {#if page == 1}
    function create_if_block_6$1(ctx) {
    	let login;
    	let updating_secretcode;
    	let current;

    	function login_secretcode_binding(value) {
    		/*login_secretcode_binding*/ ctx[21].call(null, value);
    	}

    	let login_props = {};

    	if (/*secretcode*/ ctx[2] !== void 0) {
    		login_props.secretcode = /*secretcode*/ ctx[2];
    	}

    	login = new Login({ props: login_props, $$inline: true });
    	binding_callbacks.push(() => bind(login, "secretcode", login_secretcode_binding));

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const login_changes = {};

    			if (!updating_secretcode && dirty[0] & /*secretcode*/ 4) {
    				updating_secretcode = true;
    				login_changes.secretcode = /*secretcode*/ ctx[2];
    				add_flush_callback(() => updating_secretcode = false);
    			}

    			login.$set(login_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(142:8) {#if page == 1}",
    		ctx
    	});

    	return block;
    }

    // (146:8) {#if page == 2}
    function create_if_block_5$1(ctx) {
    	let jigsaw;
    	let updating_timeout;
    	let current;

    	function jigsaw_timeout_binding(value) {
    		/*jigsaw_timeout_binding*/ ctx[22].call(null, value);
    	}

    	let jigsaw_props = {};

    	if (/*timer*/ ctx[5].timerEnd !== void 0) {
    		jigsaw_props.timeout = /*timer*/ ctx[5].timerEnd;
    	}

    	jigsaw = new Jigsaw({ props: jigsaw_props, $$inline: true });
    	binding_callbacks.push(() => bind(jigsaw, "timeout", jigsaw_timeout_binding));

    	const block = {
    		c: function create() {
    			create_component(jigsaw.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(jigsaw, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const jigsaw_changes = {};

    			if (!updating_timeout && dirty[0] & /*timer*/ 32) {
    				updating_timeout = true;
    				jigsaw_changes.timeout = /*timer*/ ctx[5].timerEnd;
    				add_flush_callback(() => updating_timeout = false);
    			}

    			jigsaw.$set(jigsaw_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jigsaw.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jigsaw.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(jigsaw, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(146:8) {#if page == 2}",
    		ctx
    	});

    	return block;
    }

    // (150:8) {#if page == 3}
    function create_if_block_4$1(ctx) {
    	let catchmind;
    	let updating_timeout;
    	let updating_codeManager;
    	let current;

    	function catchmind_timeout_binding(value) {
    		/*catchmind_timeout_binding*/ ctx[23].call(null, value);
    	}

    	function catchmind_codeManager_binding(value) {
    		/*catchmind_codeManager_binding*/ ctx[24].call(null, value);
    	}

    	let catchmind_props = {};

    	if (/*timer*/ ctx[5].timerEnd !== void 0) {
    		catchmind_props.timeout = /*timer*/ ctx[5].timerEnd;
    	}

    	if (/*secretcode*/ ctx[2] !== void 0) {
    		catchmind_props.codeManager = /*secretcode*/ ctx[2];
    	}

    	catchmind = new Catchmind({ props: catchmind_props, $$inline: true });
    	binding_callbacks.push(() => bind(catchmind, "timeout", catchmind_timeout_binding));
    	binding_callbacks.push(() => bind(catchmind, "codeManager", catchmind_codeManager_binding));

    	const block = {
    		c: function create() {
    			create_component(catchmind.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(catchmind, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const catchmind_changes = {};

    			if (!updating_timeout && dirty[0] & /*timer*/ 32) {
    				updating_timeout = true;
    				catchmind_changes.timeout = /*timer*/ ctx[5].timerEnd;
    				add_flush_callback(() => updating_timeout = false);
    			}

    			if (!updating_codeManager && dirty[0] & /*secretcode*/ 4) {
    				updating_codeManager = true;
    				catchmind_changes.codeManager = /*secretcode*/ ctx[2];
    				add_flush_callback(() => updating_codeManager = false);
    			}

    			catchmind.$set(catchmind_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(catchmind.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(catchmind.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(catchmind, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(150:8) {#if page == 3}",
    		ctx
    	});

    	return block;
    }

    // (154:8) {#if page == 4}
    function create_if_block_3$1(ctx) {
    	let varypuzzle;
    	let updating_timeout;
    	let current;

    	function varypuzzle_timeout_binding(value) {
    		/*varypuzzle_timeout_binding*/ ctx[25].call(null, value);
    	}

    	let varypuzzle_props = {};

    	if (/*timer*/ ctx[5].timerEnd !== void 0) {
    		varypuzzle_props.timeout = /*timer*/ ctx[5].timerEnd;
    	}

    	varypuzzle = new Varypuzzle({ props: varypuzzle_props, $$inline: true });
    	binding_callbacks.push(() => bind(varypuzzle, "timeout", varypuzzle_timeout_binding));

    	const block = {
    		c: function create() {
    			create_component(varypuzzle.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(varypuzzle, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const varypuzzle_changes = {};

    			if (!updating_timeout && dirty[0] & /*timer*/ 32) {
    				updating_timeout = true;
    				varypuzzle_changes.timeout = /*timer*/ ctx[5].timerEnd;
    				add_flush_callback(() => updating_timeout = false);
    			}

    			varypuzzle.$set(varypuzzle_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(varypuzzle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(varypuzzle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(varypuzzle, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(154:8) {#if page == 4}",
    		ctx
    	});

    	return block;
    }

    // (158:8) {#if page == 5}
    function create_if_block_2$1(ctx) {
    	let div;
    	let t0;
    	let input;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("같은 성전 청년들에게 칭찬과 응원의 한 마디 남겨 주세요!\n                ");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "제출하기";
    			add_location(input, file$5, 160, 16, 5491);
    			add_location(button, file$5, 160, 46, 5521);
    			add_location(div, file$5, 158, 12, 5420);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, input);
    			set_input_value(input, /*comment*/ ctx[1]);
    			append_dev(div, t1);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[26]),
    					listen_dev(button, "click", /*sendDatas*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*comment*/ 2 && input.value !== /*comment*/ ctx[1]) {
    				set_input_value(input, /*comment*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(158:8) {#if page == 5}",
    		ctx
    	});

    	return block;
    }

    // (164:8) {#if page == 6}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("성전별 모임 프로그램이 마무리 되었습니다!");
    			br = element("br");
    			add_location(br, file$5, 165, 35, 5670);
    			add_location(div, file$5, 164, 8, 5629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			append_dev(div, br);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(164:8) {#if page == 6}",
    		ctx
    	});

    	return block;
    }

    // (170:12) {#if page == 3}
    function create_if_block$2(ctx) {
    	let br;
    	let hr;
    	let t;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			br = element("br");
    			hr = element("hr");
    			t = text("\n                마지막 단계는 2, 3단계 진행 후 (Zoom 소모임으로 진행됩니다.) 통과 코드가 주어집니다! 코드를 입력하세요!\n                ");
    			input = element("input");
    			add_location(br, file$5, 170, 16, 5763);
    			attr_dev(hr, "class", "hair-line");
    			add_location(hr, file$5, 170, 21, 5768);
    			add_location(input, file$5, 172, 16, 5889);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*code4*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler_1*/ ctx[27]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*code4*/ 1 && input.value !== /*code4*/ ctx[0]) {
    				set_input_value(input, /*code4*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(170:12) {#if page == 3}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let link0;
    	let link1;
    	let link2;
    	let link3;
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let t0;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let button2;
    	let t8;
    	let button3;
    	let t10;
    	let button4;
    	let t12;
    	let button5;
    	let t14;
    	let button6;
    	let t16;
    	let div2;
    	let timer_1;
    	let updating_second;
    	let t17;
    	let div6;
    	let div3;
    	let t19;
    	let div4;
    	let t21;
    	let div5;
    	let t23;
    	let div10;
    	let div9;
    	let t24;
    	let t25;
    	let t26;
    	let t27;
    	let t28;
    	let t29;
    	let div8;
    	let t30;
    	let div7;
    	let button7;
    	let t31;
    	let button7_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*firstPage*/ ctx[6] && create_if_block_7$1(ctx);

    	function timer_1_second_binding(value) {
    		/*timer_1_second_binding*/ ctx[20].call(null, value);
    	}

    	let timer_1_props = {};

    	if (/*timer*/ ctx[5].timeLeft !== void 0) {
    		timer_1_props.second = /*timer*/ ctx[5].timeLeft;
    	}

    	timer_1 = new Timer({ props: timer_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(timer_1, "second", timer_1_second_binding));
    	let if_block1 = /*page*/ ctx[3] == 1 && create_if_block_6$1(ctx);
    	let if_block2 = /*page*/ ctx[3] == 2 && create_if_block_5$1(ctx);
    	let if_block3 = /*page*/ ctx[3] == 3 && create_if_block_4$1(ctx);
    	let if_block4 = /*page*/ ctx[3] == 4 && create_if_block_3$1(ctx);
    	let if_block5 = /*page*/ ctx[3] == 5 && create_if_block_2$1(ctx);
    	let if_block6 = /*page*/ ctx[3] == 6 && create_if_block_1$1(ctx);
    	let if_block7 = /*page*/ ctx[3] == 3 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			link1 = element("link");
    			link2 = element("link");
    			link3 = element("link");
    			script0 = element("script");
    			script1 = element("script");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t2 = text("pagetester\n        ");
    			button0 = element("button");
    			button0.textContent = "1";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "2";
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "3";
    			t8 = space();
    			button3 = element("button");
    			button3.textContent = "4";
    			t10 = space();
    			button4 = element("button");
    			button4.textContent = "5";
    			t12 = space();
    			button5 = element("button");
    			button5.textContent = "타이머종료";
    			t14 = space();
    			button6 = element("button");
    			button6.textContent = "타이머초기화";
    			t16 = space();
    			div2 = element("div");
    			create_component(timer_1.$$.fragment);
    			t17 = space();
    			div6 = element("div");
    			div3 = element("div");
    			div3.textContent = "_";
    			t19 = space();
    			div4 = element("div");
    			div4.textContent = "성전별 모임";
    			t21 = space();
    			div5 = element("div");
    			div5.textContent = "_";
    			t23 = space();
    			div10 = element("div");
    			div9 = element("div");
    			if (if_block1) if_block1.c();
    			t24 = space();
    			if (if_block2) if_block2.c();
    			t25 = space();
    			if (if_block3) if_block3.c();
    			t26 = space();
    			if (if_block4) if_block4.c();
    			t27 = space();
    			if (if_block5) if_block5.c();
    			t28 = space();
    			if (if_block6) if_block6.c();
    			t29 = space();
    			div8 = element("div");
    			if (if_block7) if_block7.c();
    			t30 = space();
    			div7 = element("div");
    			button7 = element("button");
    			t31 = text("다음 »");
    			document.title = "2021 겨울수련회 성전별 모임";
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.gstatic.com");
    			add_location(link0, file$5, 99, 4, 2866);
    			attr_dev(link1, "href", "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300&display=swap");
    			attr_dev(link1, "rel", "stylesheet");
    			add_location(link1, file$5, 100, 4, 2927);
    			attr_dev(link2, "href", "https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap");
    			attr_dev(link2, "rel", "stylesheet");
    			add_location(link2, file$5, 101, 4, 3039);
    			attr_dev(link3, "href", "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300&display=swap");
    			attr_dev(link3, "rel", "stylesheet");
    			add_location(link3, file$5, 102, 4, 3145);
    			if (script0.src !== (script0_src_value = "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$5, 103, 4, 3256);
    			if (script1.src !== (script1_src_value = "https://cdn.jsdelivr.net/npm/pouchdb@7.2.1/dist/pouchdb.min.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$5, 104, 4, 3349);
    			add_location(button0, file$5, 120, 8, 4160);
    			add_location(button1, file$5, 121, 8, 4211);
    			add_location(button2, file$5, 122, 8, 4262);
    			add_location(button3, file$5, 123, 8, 4313);
    			add_location(button4, file$5, 124, 8, 4364);
    			add_location(button5, file$5, 125, 8, 4415);
    			add_location(button6, file$5, 126, 8, 4507);
    			attr_dev(div0, "style", "position:fixed; left: 15%; top 15%");
    			add_location(div0, file$5, 118, 4, 4084);
    			attr_dev(div1, "id", "cheat");
    			set_style(div1, "display", "none");
    			add_location(div1, file$5, 117, 0, 4040);
    			attr_dev(div2, "class", "float-timer svelte-xjnb3p");
    			add_location(div2, file$5, 129, 0, 4589);
    			attr_dev(div3, "class", "nav-item svelte-xjnb3p");
    			add_location(div3, file$5, 133, 4, 4716);
    			attr_dev(div4, "class", "nav-item svelte-xjnb3p");
    			add_location(div4, file$5, 134, 4, 4750);
    			attr_dev(div5, "class", "nav-item svelte-xjnb3p");
    			add_location(div5, file$5, 135, 4, 4789);
    			attr_dev(div6, "class", "before svelte-xjnb3p");
    			toggle_class(div6, "sticky", !/*firstPage*/ ctx[6]);
    			add_location(div6, file$5, 132, 0, 4665);
    			attr_dev(button7, "class", "pretty svelte-xjnb3p");
    			button7.disabled = button7_disabled_value = !/*nextAble*/ ctx[4][/*page*/ ctx[3]];
    			attr_dev(button7, "id", "next");
    			add_location(button7, file$5, 175, 16, 6029);
    			set_style(div7, "position", "relative");
    			set_style(div7, "text-align", "right");
    			set_style(div7, "right", "8.5%");
    			add_location(div7, file$5, 174, 12, 5947);
    			add_location(div8, file$5, 168, 8, 5713);
    			attr_dev(div9, "class", "card svelte-xjnb3p");
    			add_location(div9, file$5, 139, 4, 4935);
    			attr_dev(div10, "id", "main");
    			attr_dev(div10, "class", "bgr svelte-xjnb3p");
    			set_style(div10, "background-size", "cover");
    			set_style(div10, "background-image", "url(./data/img/frt2.jpg)");
    			add_location(div10, file$5, 138, 0, 4827);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link0);
    			append_dev(document.head, link1);
    			append_dev(document.head, link2);
    			append_dev(document.head, link3);
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			append_dev(div0, t6);
    			append_dev(div0, button2);
    			append_dev(div0, t8);
    			append_dev(div0, button3);
    			append_dev(div0, t10);
    			append_dev(div0, button4);
    			append_dev(div0, t12);
    			append_dev(div0, button5);
    			append_dev(div0, t14);
    			append_dev(div0, button6);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(timer_1, div2, null);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div3);
    			append_dev(div6, t19);
    			append_dev(div6, div4);
    			append_dev(div6, t21);
    			append_dev(div6, div5);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			if (if_block1) if_block1.m(div9, null);
    			append_dev(div9, t24);
    			if (if_block2) if_block2.m(div9, null);
    			append_dev(div9, t25);
    			if (if_block3) if_block3.m(div9, null);
    			append_dev(div9, t26);
    			if (if_block4) if_block4.m(div9, null);
    			append_dev(div9, t27);
    			if (if_block5) if_block5.m(div9, null);
    			append_dev(div9, t28);
    			if (if_block6) if_block6.m(div9, null);
    			append_dev(div9, t29);
    			append_dev(div9, div8);
    			if (if_block7) if_block7.m(div8, null);
    			append_dev(div8, t30);
    			append_dev(div8, div7);
    			append_dev(div7, button7);
    			append_dev(button7, t31);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[13], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[14], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[15], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[16], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[17], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[18], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[19], false, false, false),
    					listen_dev(button7, "click", /*nextPage*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*firstPage*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*firstPage*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_7$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t1.parentNode, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const timer_1_changes = {};

    			if (!updating_second && dirty[0] & /*timer*/ 32) {
    				updating_second = true;
    				timer_1_changes.second = /*timer*/ ctx[5].timeLeft;
    				add_flush_callback(() => updating_second = false);
    			}

    			timer_1.$set(timer_1_changes);

    			if (dirty[0] & /*firstPage*/ 64) {
    				toggle_class(div6, "sticky", !/*firstPage*/ ctx[6]);
    			}

    			if (/*page*/ ctx[3] == 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*page*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div9, t24);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[3] == 2) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*page*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div9, t25);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[3] == 3) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*page*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div9, t26);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[3] == 4) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*page*/ 8) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3$1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div9, t27);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[3] == 5) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_2$1(ctx);
    					if_block5.c();
    					if_block5.m(div9, t28);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*page*/ ctx[3] == 6) {
    				if (if_block6) ; else {
    					if_block6 = create_if_block_1$1(ctx);
    					if_block6.c();
    					if_block6.m(div9, t29);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*page*/ ctx[3] == 3) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);
    				} else {
    					if_block7 = create_if_block$2(ctx);
    					if_block7.c();
    					if_block7.m(div8, t30);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (!current || dirty[0] & /*nextAble, page*/ 24 && button7_disabled_value !== (button7_disabled_value = !/*nextAble*/ ctx[4][/*page*/ ctx[3]])) {
    				prop_dev(button7, "disabled", button7_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(timer_1.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(timer_1.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link0);
    			detach_dev(link1);
    			detach_dev(link2);
    			detach_dev(link3);
    			detach_dev(script0);
    			detach_dev(script1);
    			if (detaching) detach_dev(t0);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div2);
    			destroy_component(timer_1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(div10);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $name;
    	let $order;
    	let $sanctuary;
    	let $varypuzzlecount;
    	let $clearJigsaw;
    	let $clearCMind;
    	validate_store(name, "name");
    	component_subscribe($$self, name, $$value => $$invalidate(10, $name = $$value));
    	validate_store(order, "order");
    	component_subscribe($$self, order, $$value => $$invalidate(11, $order = $$value));
    	validate_store(sanctuary, "sanctuary");
    	component_subscribe($$self, sanctuary, $$value => $$invalidate(12, $sanctuary = $$value));
    	validate_store(varypuzzlecount, "varypuzzlecount");
    	component_subscribe($$self, varypuzzlecount, $$value => $$invalidate(29, $varypuzzlecount = $$value));
    	validate_store(clearJigsaw, "clearJigsaw");
    	component_subscribe($$self, clearJigsaw, $$value => $$invalidate(30, $clearJigsaw = $$value));
    	validate_store(clearCMind, "clearCMind");
    	component_subscribe($$self, clearCMind, $$value => $$invalidate(31, $clearCMind = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const hash = function (str, seed = 0) {
    		let h1 = 3735928559 ^ seed, h2 = 1103547991 ^ seed;

    		for (let i = 0, ch; i < str.length; i++) {
    			ch = str.charCodeAt(i);
    			h1 = Math.imul(h1 ^ ch, 2654435761);
    			h2 = Math.imul(h2 ^ ch, 1597334677);
    		}

    		h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
    		h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
    		return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    	};

    	let code4, comment;
    	let firstPage = true;
    	let secretcode;
    	let page = 1;
    	let jmp = false;
    	let nextAble = [null, false, false, false, false, false, false];

    	const timer = {
    		timerId: null,
    		timeLeft: 0,
    		timerEnd: false
    	};

    	async function timerLoad(second) {
    		$$invalidate(5, timer.timerEnd = false, timer);

    		$$invalidate(
    			5,
    			timer.timerId = setInterval(
    				() => {
    					$$invalidate(5, timer.timeLeft--, timer);
    				},
    				1000
    			),
    			timer
    		);

    		setTimeout(
    			() => {
    				$$invalidate(5, timer.timerEnd = true, timer);
    				clearInterval(timer.timerId);
    			},
    			second * 1000
    		);

    		$$invalidate(5, timer.timeLeft = second, timer);
    	}

    	function clickStart() {
    		$$invalidate(6, firstPage = false);
    	}

    	function nextPage() {
    		if (jmp) {
    			$$invalidate(3, page = 5);
    			return;
    		}

    		if (page == 1) {
    			timerLoad(630);

    			setTimeout(
    				() => {
    					$$invalidate(4, nextAble[2] = true, nextAble);
    				},
    				600
    			);
    		}

    		if (page == 2) {
    			timerLoad(1530);

    			setTimeout(
    				() => {
    					$$invalidate(4, nextAble[3] = true, nextAble);
    				},
    				1500
    			);
    		}

    		if (page == 3) {
    			timerLoad(630);
    		}

    		$$invalidate(3, page++, page);
    	}

    	function sendDatas() {
    		var db = new PouchDB("http://admin:19450815@localhost:5984");

    		db.put({
    			_id: hash($name + $sanctuary + $order),
    			name: $name,
    			order: $order,
    			sanct: $sanctuary,
    			time: new Date(),
    			cnt1: $varypuzzlecount,
    			cnt2: $clearJigsaw,
    			cnt3: $clearCMind
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, page = 1);
    	const click_handler_1 = () => $$invalidate(3, page = 2);
    	const click_handler_2 = () => $$invalidate(3, page = 3);
    	const click_handler_3 = () => $$invalidate(3, page = 4);
    	const click_handler_4 = () => $$invalidate(3, page = 5);

    	const click_handler_5 = () => {
    		$$invalidate(5, timer.timerLeft = 0, timer);
    		$$invalidate(5, timer.timerEnd = true, timer);
    	};

    	const click_handler_6 = () => {
    		$$invalidate(5, timer.timerEnd = false, timer);
    	};

    	function timer_1_second_binding(value) {
    		timer.timeLeft = value;
    		$$invalidate(5, timer);
    	}

    	function login_secretcode_binding(value) {
    		secretcode = value;
    		$$invalidate(2, secretcode);
    	}

    	function jigsaw_timeout_binding(value) {
    		timer.timerEnd = value;
    		$$invalidate(5, timer);
    	}

    	function catchmind_timeout_binding(value) {
    		timer.timerEnd = value;
    		$$invalidate(5, timer);
    	}

    	function catchmind_codeManager_binding(value) {
    		secretcode = value;
    		$$invalidate(2, secretcode);
    	}

    	function varypuzzle_timeout_binding(value) {
    		timer.timerEnd = value;
    		$$invalidate(5, timer);
    	}

    	function input_input_handler() {
    		comment = this.value;
    		$$invalidate(1, comment);
    	}

    	function input_input_handler_1() {
    		code4 = this.value;
    		$$invalidate(0, code4);
    	}

    	$$self.$capture_state = () => ({
    		fade,
    		clearJigsaw,
    		varypuzzlecount,
    		clearCMind,
    		name,
    		sanctuary,
    		order,
    		Timer,
    		Jigsaw,
    		Login,
    		Catchmind,
    		Varypuzzle,
    		hash,
    		code4,
    		comment,
    		firstPage,
    		secretcode,
    		page,
    		jmp,
    		nextAble,
    		timer,
    		timerLoad,
    		clickStart,
    		nextPage,
    		sendDatas,
    		$name,
    		$order,
    		$sanctuary,
    		$varypuzzlecount,
    		$clearJigsaw,
    		$clearCMind
    	});

    	$$self.$inject_state = $$props => {
    		if ("code4" in $$props) $$invalidate(0, code4 = $$props.code4);
    		if ("comment" in $$props) $$invalidate(1, comment = $$props.comment);
    		if ("firstPage" in $$props) $$invalidate(6, firstPage = $$props.firstPage);
    		if ("secretcode" in $$props) $$invalidate(2, secretcode = $$props.secretcode);
    		if ("page" in $$props) $$invalidate(3, page = $$props.page);
    		if ("jmp" in $$props) jmp = $$props.jmp;
    		if ("nextAble" in $$props) $$invalidate(4, nextAble = $$props.nextAble);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$name, $order, $sanctuary*/ 7168) {
    			 if ($name != "" && $order != "" && $sanctuary != "") {
    				$$invalidate(4, nextAble[1] = true, nextAble);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*nextAble, timer, secretcode*/ 52) {
    			 if (nextAble[3] && timer.timerEnd == true && secretcode == "베드로153") {
    				$$invalidate(4, nextAble[4] = true, nextAble);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*page, code4*/ 9) {
    			 if (page == 3 && code4 == "먼저-그-나라와-그-의를-구하라") {
    				jmp = true;
    			}
    		}

    		if ($$self.$$.dirty[0] & /*page, comment*/ 10) {
    			 if (page == 5 && comment != "") {
    				$$invalidate(4, nextAble[6] = true, nextAble);
    			}
    		}
    	};

    	return [
    		code4,
    		comment,
    		secretcode,
    		page,
    		nextAble,
    		timer,
    		firstPage,
    		clickStart,
    		nextPage,
    		sendDatas,
    		$name,
    		$order,
    		$sanctuary,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		timer_1_second_binding,
    		login_secretcode_binding,
    		jigsaw_timeout_binding,
    		catchmind_timeout_binding,
    		catchmind_codeManager_binding,
    		varypuzzle_timeout_binding,
    		input_input_handler,
    		input_input_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
